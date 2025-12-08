export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct answer
}

export const QUIZ_DATA: Question[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "What is 2 + 2 * 2?",
    options: ["6", "8", "4", "10"],
    correctAnswer: 0
  },
  {
    id: 4,
    question: "Which element has the chemical symbol 'O'?",
    options: ["Gold", "Silver", "Oxygen", "Iron"],
    correctAnswer: 2
  },
  {
    id: 5,
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"],
    correctAnswer: 2
  },
  {
    id: 6,
    question: "What is the largest mammal in the world?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Hippo"],
    correctAnswer: 1
  },
  {
    id: 7,
    question: "How many sides does a triangle have?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1
  },
  {
    id: 8,
    question: "Water boils at what temperature (Celsius)?",
    options: ["90°C", "100°C", "110°C", "120°C"],
    correctAnswer: 1
  }
];