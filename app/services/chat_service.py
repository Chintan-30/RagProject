from openai import OpenAI
from langchain_qdrant import QdrantVectorStore
from langchain_openai import OpenAIEmbeddings
from app.config import OPENAI_API_KEY
from app.utils.logger import logger
from qdrant_client import QdrantClient


class ChatService:
    def __init__(self):
        self.openai_client = OpenAI()
        self.embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")

    async def get_answer(self, query: str, collection_name: str, max_results: int = 4, model: str = "gpt-4.1"):
        """Get an AI-generated answer based on document context"""
        try:
            qdrant_client = QdrantClient(url="http://localhost:6333")

            # Initialize vector store (new API for 0.3.x)
            vector_db = QdrantVectorStore(
                client=qdrant_client,
                collection_name=collection_name,
                embedding=self.embedding_model
            )

            # Perform similarity search
            search_results = vector_db.similarity_search_with_score(
                query=query,
                k=max_results
            )

            if not search_results:
                return None, []

            # Format search results and prepare context
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

            # Create system prompt
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

            # Get AI response
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]

            response = self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )

            return response.choices[0].message.content, formatted_results

        except Exception as e:
            logger.error(f"Error in get_answer: {str(e)}")
            raise

    async def get_sample_questions(self, collection_name: str, limit: int = 3):
        """Generate sample questions for a collection"""
        try:
            
            vector_db = QdrantVectorStore.from_existing_collection(
                client=collection_name,
                embedding=self.embedding_model,
                url="http://localhost:6333"   # or pass client if supported
            )


            sample_docs = vector_db.similarity_search("", k=2)
            
            if not sample_docs:
                return []

            sample_content = sample_docs[0].page_content[:500]
            
            messages = [
                {"role": "system", "content": "Generate 3 interesting and specific questions that could be asked about this content. Return only the questions, one per line."},
                {"role": "user", "content": sample_content}
            ]

            response = self.openai_client.chat.completions.create(
                model="gpt-4.1",
                messages=messages,
                temperature=0.7,
                max_tokens=200
            )

            questions = response.choices[0].message.content.strip().split("\n")
            return questions[:limit]

        except Exception as e:
            logger.error(f"Error generating sample questions: {str(e)}")
            raise
