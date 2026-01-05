export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const QUIZ_DATA: Question[] = [
  {
    id: 1,
    question: "人工智能（AI）的定义仅限于机器人的制造，不包含语言理解和感知能力。",
    options: ["正确", "错误"],
    correctAnswer: 1
  },
  {
    id: 2,
    question: "强人工智能（AGI）的主要特点是？",
    options: ["只能推荐电影", "拥有与人类一样的思考和学习能力", "比人类聪明亿万倍", "需要人工编写所有规则"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "目前专门用于特定任务（如下棋或推荐系统）的AI属于哪一类？",
    options: ["弱人工智能 (ANI)", "强人工智能 (AGI)", "超人工智能 (ASI)", "具身智能"],
    correctAnswer: 0
  },
  {
    id: 4,
    question: "机器学习的核心概念是？",
    options: ["依赖预先编写的规则", "数据驱动决策，通过分析大量数据做出选择", "完全模仿人脑的生物结构", "只使用未标记的数据"],
    correctAnswer: 1
  },
  {
    id: 5,
    question: "“监督学习”可以类比为学生看带答案的练习册进行学习。",
    options: ["正确", "错误"],
    correctAnswer: 0
  },
  {
    id: 6,
    question: "无监督学习的类比是“像整理一个杂乱的房间，把相似的东西放在一起”。",
    options: ["正确", "错误"],
    correctAnswer: 0
  },
  {
    id: 7,
    question: "在监督学习中，给机器的数据通常带有“标签”，例如？",
    options: ["图片上标明“猫”或“狗”", "没有说明的图片", "随机生成的数字", "机器自己生成的预测"],
    correctAnswer: 0
  },
  {
    id: 8,
    question: "计算机视觉不仅能识别物体，还能在图像中定位它们的位置和边界，这项技术叫什么？",
    options: ["图像识别 (Image Recognition)", "目标检测 (Object Detection)", "语音合成", "情感分析"],
    correctAnswer: 1
  },
  {
    id: 9,
    question: "材料中提到的 YOLO 算法，主要用于解决什么问题？",
    options: ["快速高效的目标检测", "机器翻译", "自动音乐生成", "复杂的数学计算"],
    correctAnswer: 0
  },
  {
    id: 10,
    question: "自然语言处理 (NLP) 的核心理念是让机器能够听、说、读、写。",
    options: ["正确", "错误"],
    correctAnswer: 0
  }
];