# Dynamic Programming Visualizer

An interactive web application for visualizing dynamic programming algorithms through multiple perspectives: recursion trees, memoization, and tabulation.

## Features

- **Multi-Perspective Visualization**: View algorithms through three different lenses

  - Recursion Tree: Interactive canvas with pan/zoom capabilities
  - Memoization: Call stack and cache visualization with animated connections
  - DP Table: Step-by-step table building with dependency tracking
- **Interactive Controls**:

  - Play/Pause animation
  - Step forward/backward through execution
  - Adjustable speed (50ms - 2000ms per step)
  - Reset functionality
- **Supported Problems**:

  - Fibonacci Sequence
  - Coin Change
  - 0/1 Knapsack
  - Longest Common Subsequence (LCS)
- **Real-Time Statistics**:

  - Recursive call count
  - Time complexity analysis
  - Space complexity tracking

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **HTML5 Canvas** for tree visualization
- **CSS Grid & Flexbox** for responsive layout

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd "Dynamic Programming Visulazer"
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Select a Problem**: Choose from Fibonacci, Coin Change, Knapsack, or LCS
2. **Configure Inputs**: Enter problem-specific parameters (numbers, arrays, strings)
3. **Click Visualize**: Generate the visualization
4. **Explore Views**: Switch between Tree, Memoization, and DP Table tabs
5. **Control Playback**: Use play/pause, step controls, and speed adjustment
6. **Interact with Tree**: Drag to pan, scroll to zoom in the recursion tree view

## How It Works

The visualizer executes dynamic programming algorithms and records each computational step. These steps are then replayed as animations, allowing you to see how the algorithm builds solutions incrementally. The caching system ensures smooth switching between different visualization modes without recomputing.

## Algorithms

Each algorithm implements three approaches:

- **Recursive (Tree)**: Shows overlapping subproblems
- **Memoized (Top-down DP)**: Demonstrates caching optimization
- **Tabulated (Bottom-up DP)**: Illustrates iterative table building

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

Built with modern web technologies for educational purposes to help understand dynamic programming concepts through interactive visualization.
