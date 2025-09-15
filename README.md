# Theoremotion

## Description:
Theoremotion is a web application designed to [**TODO: Add a more specific description here based on the project's actual purpose. For example: "explore and visualize mathematical theorems with interactive motion graphics," or "assist in the creation and validation of logical proofs."**]. It leverages Next.js for a responsive frontend, a custom API for interacting with Ollama (likely for language model integrations or local AI), and a database for managing embeddings.

## Features:
*   **Interactive Theorem Visualization:** (if applicable) Visualize complex mathematical theorems through dynamic and interactive motion graphics.
*   **AI-driven Manim Animation Generation:** Dynamically generate and render high-quality mathematical animations using Manim, driven by AI-generated Python scripts.
*   **Real-time Animation Streaming:** Stream the progress and final output of Manim animations in real-time via WebSocket connections.
*   **Ollama Integration:** Utilize the power of local language models (via Ollama) for [**TODO: Specify Ollama's role, e.g., "natural language processing of mathematical statements," "generating explanations," or "assisting with proof construction."**].
*   **Vector Embeddings:** Efficiently store and retrieve knowledge or contextual information using database embeddings.
*   **Modern Web Stack:** Built with Next.js, React, and TypeScript for a robust and scalable application.
*   **[TODO: Add more specific features based on the application's functionality]**

## Technologies Used:
*   **Frontend:**
    *   Next.js
    *   React
    *   TypeScript
    *   Tailwind CSS (or similar for styling based on `globals.css` and `components/ui` )
*   **Backend/API:**
    *   Next.js API Routes
    *   Ollama (for local LLM interactions)
    *   Hono.js (for the animation rendering service)
    *   Manim (for mathematical animation generation)
    *   [**TODO: Specify database technology, e.g., "PostgreSQL," "MongoDB," "SQLite"**]
    *   [**TODO: Add any other backend frameworks/libraries if applicable**]
*   **Tooling:**
    *   Bun (package manager, based on `bun.lock` file)
    *   ESLint
    *   Prettier

## Setup and Installation:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/theoremotion.git
    cd theoremotion
    ```

2.  **Install Dependencies:**
    This project uses `bun` as its package manager.
    ```bash
    bun install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add necessary environment variables.
    ```
    # Example:
    OLLAMA_API_URL=http://localhost:11434
    DATABASE_URL="[TODO: Your Database Connection String]"
    ```

4.  **Database Setup:**
    [**TODO: Add specific instructions for database migration/setup, e.g., `npx prisma migrate dev` if using Prisma**]

5.  **Run Ollama (if not already running):**
    Ensure Ollama is running on your system, or follow its installation instructions.

6.  **Run the Development Server:**
    ```bash
    bun run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure:

*   `app/`: Main Next.js application, including pages, components, and API routes.
    *   `api/`: Backend API routes for database embeddings and Ollama interactions.
    *   `components/`: React components used across the application.
    *   `db/`: Database utility functions.
*   `components/ui/`: Reusable UI components (shadcn/ui or similar).
*   `lib/`: Utility functions.
*   `public/`: Static assets.
*   `service/`: A dedicated backend service responsible for executing AI-generated Python scripts (Manim animations) and streaming the rendered video output. It utilizes Hono.js for its API and Bun for process management.
    *   `src/index.ts`: The entry point for the Hono.js service, handling WebSocket connections for real-time script execution and video streaming, and a POST endpoint for direct video requests.
    *   `Dockerfile`: Defines the containerization environment for the service.
*   `README.md`: This file.

## Contributing:
[**TODO: Add contribution guidelines if applicable**]

## License:
[**TODO: Add licensing information**]
