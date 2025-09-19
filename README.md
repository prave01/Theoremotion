# ✨ Theoremotion: Dynamic Mathematical Animation Platform ✨

## Description:
Theoremotion is an web application designed to **explore and visualize mathematical theorems with interactive motion graphics**. It leverages a powerful Next.js frontend, custom APIs for orchestrating local AI capabilities via Ollama, and a robust vector database for managing embeddings. At its core, Theoremotion features **AI-driven generation and debugging of Manim animation scripts**, enabling users to bring complex mathematical concepts to life with ease.

## 🚀 Features:
*   **Interactive Theorem Visualization:** Dive deep into complex mathematical theorems through dynamic and interactive motion graphics, making abstract concepts tangible and understandable.
*   **🧠 AI-Powered Manim Script Generation:** Dynamically generate high-quality, lecture-ready mathematical animations using Manim. Our innovative two-stage LLM prompting system, enhanced by a vector database for contextual relevance, translates natural language prompts into precise Python (Manim) scripts.
*   **🐞 AI-Assisted Script Debugging:** Automatically identify and fix issues in generated Manim scripts. Our LLM-powered debugging mechanism provides corrected scripts, detailed diagnostics, and confidence levels, ensuring smooth animation rendering.
*   **⚡ Real-time Animation Streaming:** Experience the creation process in real-time. Stream the progress and final MP4 output of your Manim animations directly to your browser via WebSocket connections.
*   **🌌 Ollama Integration:** Harness the power of local language models (via Ollama) for diverse tasks such as natural language processing of mathematical statements, generating insightful explanations, or assisting with proof construction.
*   **📊 Vector Embeddings:** Efficiently store and retrieve a vast knowledge base of mathematical prompts, Manim scripts, and their vector embeddings. This powers intelligent context-aware script generation and rapid information retrieval.
*   **🌐 Modern Web Stack:** Built with Next.js, React, and TypeScript, providing a robust, scalable, and highly responsive application experience.

## 🛠️ Technologies Used:
*   **Frontend:**
    *   Next.js: React framework for production-grade applications.
    *   React: A declarative, component-based JavaScript library for building user interfaces.
    *   TypeScript: Superset of JavaScript that adds static typing.
    *   Tailwind CSS: A utility-first CSS framework for rapidly building custom designs.
*   **Backend/API:**
    *   Next.js API Routes: For seamless frontend-backend integration and general API endpoints.
    *   Ollama: For local Large Language Model (LLM) interactions, enabling privacy-focused AI capabilities.
    *   **Groq (OpenAI-compatible API):** Orchestrates multiple LLMs for sophisticated AI reasoning, prompt generation, and debugging.
    *   **Hugging Face Inference:** Utilized for efficient feature extraction and generating vector embeddings from textual data.
    *   Hono.js: A lightweight, fast web framework used for the dedicated animation rendering service.
    *   Manim: A powerful Python library for creating stunning mathematical animations programmatically.
    *   PostgreSQL: A robust, open-source relational database, used here for storing `manim_finetune_data` and vector embeddings (replace with your actual database if different).
*   **Tooling:**
    *   Bun: An incredibly fast all-in-one JavaScript runtime and package manager.
    *   ESLint: For maintaining code quality and consistency.
    *   Prettier: An opinionated code formatter.

## 🚀 Setup and Installation:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/theoremotion.git
    cd theoremotion
    ```

2.  **Install Dependencies:**
    This project uses `bun` as its package manager. Ensure you have Bun installed, then run:
    ```bash
    bun install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory of the project and populate it with your environment variables:
    ```
    # Example:
    OLLAMA_API_URL=http://localhost:11434
    DATABASE_URL="postgres://user:password@host:port/database"
    GROQ_KEY="your_groq_api_key"
    HUGGING_FACE="your_hugging_face_api_key"
    ```
    *   `OLLAMA_API_URL`: The URL for your running Ollama instance.
    *   `DATABASE_URL`: Your PostgreSQL connection string.
    *   `GROQ_KEY`: Your API key for Groq services.
    *   `HUGGING_FACE`: Your API key for Hugging Face Inference.

4.  **Database Setup:**
    If using PostgreSQL, ensure your database is running and accessible. You may need to run migration commands specific to your ORM (e.g., `npx prisma migrate dev` if using Prisma) to set up the `manim_finetune_data` table.

5.  **Run Ollama (if not already running):**
    Ensure Ollama is running on your system with the `mxbai-embed-large:latest` model downloaded. Follow Ollama's official installation instructions if needed.

6.  **Run the Development Servers:**
    *   **Main Next.js Application:**
        ```bash
        bun run dev
        ```
        Open [http://localhost:3000](http://localhost:3000) with your browser to see the frontend.
    *   **Manim Rendering Service:**
        Navigate to the `service` directory and start the Hono.js server:
        ```bash
        cd service
        bun run start
        ```
        This service will typically run on port `4000` (configurable via `PORT` environment variable).

## 📁 Project Structure:

*   `app/`: The core Next.js application.
    *   `api/`: Defines backend API routes.
        *   `database/addEmbedding/`: Endpoint for adding new vector embeddings to the database.
        *   `ollama/debug/`: API for AI-assisted debugging of Manim scripts.
        *   `ollama/getOllama/`: API for AI-powered generation of Manim scripts, utilizing LLMs and vector search.
    *   `components/`: Reusable React components.
    *   `db/`: Database utility functions and connection setup.
*   `components/ui/`: A collection of reusable UI components (e.g., shadcn/ui).
*   `lib/`: General utility functions and helper modules.
*   `public/`: Static assets such as images and favicons.
*   `service/`: A dedicated backend service responsible for executing AI-generated Python scripts (Manim animations) and streaming the rendered video output.
    *   `src/index.ts`: The entry point for the Hono.js service, handling WebSocket connections for real-time script execution and video streaming, and a POST endpoint for direct video requests.
    *   `Dockerfile`: Defines the containerization environment for the service.
*   `README.md`: This comprehensive project overview.

## 🤝 Contributing:
Contributions are highly welcome! If you have suggestions for improvements, new features, or bug fixes, please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and ensure they adhere to the project's coding standards.
4.  Commit your changes (`git commit -m "feat: Add new feature"`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request, providing a clear description of your changes.

For major changes, please open an issue first to discuss what you would like to change.

## ⚖️ License:
This project is open-source and licensed under the **MIT License**. See the `LICENSE` file for more details.
