# Migration to Gemini

This document summarizes the changes made to migrate the application from using OpenAI APIs to Google Gemini APIs.

## UI/Frontend Enhancements (Angular)

Several UI/Frontend enhancements have been implemented to improve user experience and make the application production-ready.

-   **Uploader Component (`generic-uploader`)**:
    *   Improved the upload progress display with a more visually appealing and informative one using Angular Material's `mat-list` and `mat-icon`.
    *   Added a "Clear Completed" button to allow users to easily remove completed uploads from the list.
    *   Resolved `Cannot find name 'MatIconModule'` and `Cannot find name 'MatListModule'` errors by importing `MaterialModule` and removing direct imports in `generic-uploader.component.ts`.
-   **Document Table Component (`document-table`)**:
    *   Used the `file_type` information coming from the backend to display a specific icon for each document type (e.g., a PDF icon for PDFs, an image icon for images).
-   **Chat Interface Component (`chat-interface`)**:
    *   Added a "copy" button to each of the bot's messages, allowing users to easily copy the generated text to your clipboard.
    *   Improved the layout of the chat interface for a more modern and polished look.
-   **Preview Component (`split-panel`)**:
    *   Replaced `angular-split` with Angular Material's `mat-sidenav` for the split view, improving compatibility and consistency.

## Files Changed

- `app/config.py`: Removed `IMAGE_MODEL_NAME`.
- `app/services/image_service.py`: This file has been deleted.
- `app/services/dbservices.py`: Added a `file_type` column to the `Document` model (this change remains).
- `app/routers/indexing_router.py`: Updated the `/upload` endpoint to use `indexing_service.process_image` instead of `ImageService`.
- `app/services/indexing_service.py`: Added a `process_image` method to handle image descriptions using the main multimodal model.
- `WebClient/rag-chat/src/app/features/upload/components/generic-uploader/generic-uploader.html`: Updated to accept image file types (this change remains).
- `WebClient/rag-chat/src/app/features/upload/components/generic-uploader/generic-uploader.component.ts`: Updated imports for Angular Material components.
- `WebClient/rag-chat/src/app/features/upload/components/generic-uploader/generic-uploader.scss`: Updated styling for upload progress.
- `WebClient/rag-chat/src/app/features/document-details/components/document-table/document-table.component.ts`: Updated `DocumentInfo` interface and `getFileIcon` method.
- `WebClient/rag-chat/src/app/features/document-details/components/document-table/document-table.html`: Updated to use `getFileIcon` method.
- `WebClient/rag-chat/src/app/features/preview-chat/components/chat-interface/chat-interface.component.ts`: Added `copyToClipboard` method.
- `WebClient/rag-chat/src/app/features/preview-chat/components/chat-interface/chat-interface.html`: Added copy button to bot messages.
- `WebClient/rag-chat/src/app/features/preview-chat/preview-chat.module.ts`: Removed `AngularSplitModule` import.
- `WebClient/rag-chat/src/app/features/preview-chat/components/split-panel/split-panel.component.ts`: Updated to use `mat-sidenav`.
- `WebClient/rag-chat/src/app/features/preview-chat/components/split-panel/split-panel.html`: Updated to use `mat-sidenav-container`.
- `WebClient/rag-chat/src/app/features/preview-chat/components/split-panel/split-panel.scss`: Added styles for `mat-sidenav`.
- `requirements.txt`: Updated to specify compatible versions of `langchain-google-genai` and `google-generativeai`.

## Manual Review Points

- The `chat_service.py` now constructs a single payload string for the Gemini API, combining the system prompt and user query. This is a change from the previous messages array structure.
- The error handling for the Gemini API calls should be reviewed to ensure it aligns with the expected error responses from the new SDK.

## Commands to Run Locally

1.  **Update environment variables**:
    - Rename your `.env` file's `OPENAI_API_KEY` to `GOOGLE_API_KEY` and set it to your Google AI Studio API key.

2.  **Install/update dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run tests** (if available) or manually test the application's indexing and chat features.
