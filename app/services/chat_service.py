import google.generativeai as genai                 # <-- CHANGED: Import Google's client
from langchain_qdrant import QdrantVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings  # <-- CHANGED: Import Google's embedding model
from app.utils.logger import logger
from qdrant_client import QdrantClient
import os                                           # <-- CHANGED: Need this for the API key
from app.config import CHAT_MODEL_NAME, EMBEDDING_MODEL_NAME

# Removed: from openai import OpenAI
# Removed: from langchain_openai import OpenAIEmbeddings
# Removed: from app.config import OPENAI_API_KEY


class ChatService:
    def __init__(self):
        # MIGRATED_TO_GEMINI on 2025-11-18 by auto-migration
        try:
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        except Exception as e:
            logger.error(f"Error configuring Google AI: {str(e)}")
            raise

        self.chat_model_name = CHAT_MODEL_NAME
        self.embedding_model = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL_NAME)

    async def get_answer(self, query: str, collection_name: str, max_results: int = 4, model: str = None):
        """Get an AI-generated answer based on document context"""
        try:
            qdrant_client = QdrantClient(url="http://localhost:6333")

            vector_db = QdrantVectorStore(
                client=qdrant_client,
                collection_name=collection_name,
                embedding=self.embedding_model
            )

            search_results = vector_db.similarity_search_with_score(
                query=query,
                k=max_results
            )

            if not search_results:
                return None, []

            formatted_results = []
            context_parts = []
            
            for doc, score in search_results:
                formatted_result = {
                    "page_content": doc.page_content,
                    "page_number": doc.metadata.get("page"),
                    "source": doc.metadata.get("source"),
                    "score": score
                }
                formatted_results.append(formatted_result)
                context_parts.append(doc.page_content)

            context = "\n\n---\n\n".join(context_parts)

            system_prompt = f"""You are a helpful AI assistant that answers user queries based on the available context 
retrieved from a PDF file along with page contents and page numbers.

You should only answer the user based on the following context and guide the user 
to open the right page number to know more details.

Important guidelines:
- Only use information from the provided context
- If the context doesn't contain enough information, say so clearly
- Always mention relevant page numbers when available
- Be concise but comprehensive
- If you're unsure, acknowledge the uncertainty

Context:
{context}"""
            # MIGRATED_TO_GEMINI on 2025-11-18 by auto-migration
            chat_model = genai.GenerativeModel(model if model else self.chat_model_name)
            payload = f"{system_prompt}\n\nUser Query: {query}"
            resp = await chat_model.generate_content_async(payload, generation_config=genai.GenerationConfig(temperature=0.7, max_output_tokens=800))
            
            return resp.text, formatted_results

        except Exception as e:
            logger.error(f"Error in get_answer: {str(e)}")
            raise

    async def get_sample_questions(self, collection_name: str, limit: int = 3):
        """Generate sample questions for a collection"""
        try:
            qdrant_client = QdrantClient(url="http://localhost:6333")
            
            vector_db = QdrantVectorStore(
                client=qdrant_client,
                collection_name=collection_name,
                embedding=self.embedding_model,
            )

            sample_docs = vector_db.similarity_search("", k=2)
            
            if not sample_docs:
                return []

            sample_content = sample_docs[0].page_content[:500]
            
            # MIGRATED_TO_GEMINI on 2025-11-18 by auto-migration
            system_prompt_questions = "Generate 3 interesting and specific questions that could be asked about this content. Return only the questions, one per line."
            
            model = genai.GenerativeModel(self.chat_model_name)
            response = await model.generate_content_async(
                f"{system_prompt_questions}\n\nContent: {sample_content}",
                generation_config=genai.GenerationConfig(temperature=0.7, max_output_tokens=200)
            )

            questions = response.text.strip().split("\n")
            return questions[:limit]

        except Exception as e:
            logger.error(f"Error generating sample questions: {str(e)}")
            raise