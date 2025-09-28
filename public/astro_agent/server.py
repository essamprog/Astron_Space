from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import chromadb
from sentence_transformers import SentenceTransformer
import traceback

app = Flask(__name__)
CORS(app)  # السماح للطلبات من الواجهة الأمامية

print("-> Initializing Embedding model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# --- الاتصال بقاعدة بيانات ChromaDB الموجودة ---
print("-> Connecting to vector database...")
try:
    db_client = chromadb.PersistentClient(path="my_vector_db")
    collection = db_client.get_collection(name="research_papers")
    print(f"   Found {collection.count()} documents in database")
except Exception as e:
    print(f"Database connection error: {e}")
    exit(1)

class SimpleRAGModel:
    """
    نموذج RAG بسيط يعمل بدون الحاجة لـ HuggingFace API
    يقوم بتحليل السياق وإعطاء إجابات ذكية
    """
    
    def __init__(self):
        self.name = "نظام البحث الذكي للأبحاث العلمية"
    
    def generate_answer(self, context, question):
        """
        توليد إجابة بناءً على السياق والسؤال
        """
        # تنظيف السياق
        if not context or context == "لا توجد معلومات متاحة.":
            return "المعلومات غير متوفرة في الأبحاث المقدمة."
        
        # تحليل بسيط للسؤال
        question_lower = question.lower()
        context_lower = context.lower()
        
        # البحث عن الكلمات المفتاحية في السياق
        question_words = question_lower.split()
        relevant_sentences = []
        
        sentences = context.split('.')
        for sentence in sentences:
            sentence_lower = sentence.lower()
            # إذا وُجدت كلمات من السؤال في الجملة
            matches = sum(1 for word in question_words if word in sentence_lower)
            if matches > 0 and len(sentence.strip()) > 10:
                relevant_sentences.append((sentence.strip(), matches))
        
        # ترتيب الجمل حسب الصلة
        relevant_sentences.sort(key=lambda x: x[1], reverse=True)
        
        if not relevant_sentences:
            return "المعلومات غير متوفرة في الأبحاث المقدمة."
        
        # بناء الإجابة
        answer = "بناءً على المصادر المتاحة:\n\n"
        
        # أخذ أهم 3 جمل ذات صلة
        for sentence, _ in relevant_sentences[:3]:
            if sentence:
                answer += f"• {sentence}.\n"
        
        # إضافة خلاصة بسيطة
        if "what" in question_lower or "ما" in question_lower:
            answer += f"\nوبشكل مجمل، المعلومات المتاحة تشير إلى المواضيع المذكورة أعلاه."
        
        return answer

# إنشاء النموذج
print("-> Initializing local RAG model...")
llm_model = SimpleRAGModel()
print("   Local model initialized successfully")

def retrieve_context(query, n_results=5):
    """
    البحث في قاعدة البيانات عن المحتوى ذو الصلة
    """
    try:
        query_embedding = embedding_model.encode([query]).tolist()
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(n_results, collection.count())
        )
        
        if results['documents'] and len(results['documents']) > 0:
            return results['documents'][0]
        else:
            return ["لا توجد مستندات ذات صلة في قاعدة البيانات."]
            
    except Exception as e:
        print(f"Search error: {e}")
        return ["Error retrieving information."]

def format_context(docs):
    """
    تنسيق المستندات في نص واحد
    """
    if not docs or len(docs) == 0:
        return "لا توجد معلومات متاحة."
    
    # دمج النصوص مع التنظيف
    formatted_docs = []
    for doc in docs:
        if doc and len(doc.strip()) > 10:  # تجنب النصوص الفارغة أو القصيرة جداً
            formatted_docs.append(doc.strip())
    
    return " ".join(formatted_docs[:3])  # أخذ أهم 3 مستندات

def create_rag_response(question):
    """
    إنشاء استجابة RAG كاملة
    """
    try:
        print(f"   Searching for: {question}")
        
        # استرجاع السياق
        context_docs = retrieve_context(question, n_results=5)
        context = format_context(context_docs)
        
        print(f"   Found {len(context_docs)} documents")
        
        # توليد الإجابة
        response = llm_model.generate_answer(context, question)
        
        return response, len(context_docs)
        
    except Exception as e:
        error_msg = f"System error: {str(e)}"
        print(f"Error details: {traceback.format_exc()}")
        return error_msg, 0

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    نقطة النهاية الرئيسية للدردشة
    """
    try:
        data = request.get_json()
        question = data.get('message', '').strip()
        
        if not question:
            return jsonify({
                'error': 'يرجى كتابة سؤال صحيح.'
            }), 400
        
        # معالجة السؤال
        print(f"Processing question: {question}")
        answer, num_sources = create_rag_response(question)
        
        return jsonify({
            'response': answer,
            'sources_count': num_sources,
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({
            'error': 'Error processing request.',
            'details': str(e)
        }), 500

@app.route('/api/info', methods=['GET'])
def get_info():
    """
    الحصول على معلومات قاعدة البيانات
    """
    try:
        return jsonify({
            'documents_count': collection.count(),
            'embedding_dimensions': embedding_model.get_sentence_embedding_dimension(),
            'model_name': llm_model.name,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'error': 'خطأ في الحصول على المعلومات',
            'details': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    فحص صحة النظام
    """
    return jsonify({
        'status': 'healthy',
        'message': 'النظام يعمل بشكل طبيعي'
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("RAG System for Research Papers")
    print("="*50)
    print("System ready and working perfectly!")
    print("Server running on: http://localhost:5000")
    print("Documents in database:", collection.count())
    
    app.run(debug=True, host='0.0.0.0', port=5000)
