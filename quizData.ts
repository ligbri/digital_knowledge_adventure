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
  },
  {
    id: 11,
    question: "图像识别的核心概念是让机器理解图像中的内容是什么物体，但不需要定位位置。",
    options: ["正确", "错误"],
    correctAnswer: 0 // 错误
  },
  {
    id: 12,
    question: "计算机视觉的关键技术点不包括以下哪项？",
    options: ["像素分析", "特征提取", "模式匹配", "语音转文字"],
    correctAnswer: 3 // D. 语音转文字
  },
  {
    id: 13,
    question: "自然语言处理 (NLP) 的核心理念是让机器能够听、说、读、写。",
    options: ["正确", "错误"],
    correctAnswer: 0 // 正确
  },
  {
    id: 14,
    question: "在智慧医疗领域，AI的应用包括？",
    options: [
      "辅助诊断（如分析医学影像）",
      "加速新药研发", 
      "实现精准治疗",
      "以上都是"
    ],
    correctAnswer: 3 // D. 以上都是
  },
  {
    id: 15,
    question: "智能交通系统利用AI进行城市交通信号优化和无人驾驶技术研发。",
    options: ["正确", "错误"],
    correctAnswer: 0 // 正确
  },
  {
    id: 16,
    question: "算法偏见产生的原因可能包括？",
    options: [
      "使用了带有偏颇的数据",
      "算法设计存在缺陷", 
      "缺乏多样性的开发团队",
      "A和B"
    ],
    correctAnswer: 3 // D. A和B
  },
  {
    id: 17,
    question: "AI在艺术领域的应用可以实现？",
    options: [
      "自动音乐生成",
      "AI绘画激发灵感", 
      "跨界艺术创作",
      "以上都是"
    ],
    correctAnswer: 3 // D. 以上都是
  },
  {
    id: 18,
    question: "个性化教育通过AI可以根据学生的进度定制学习路径。",
    options: ["正确", "错误"],
    correctAnswer: 0 // 正确
  },
  {
    id: 19,
    question: "保护数据隐私不是AI发展的基本前提，技术进步更重要。",
    options: ["正确", "错误"],
    correctAnswer: 1 // 错误
  },
  {
    id: 20,
    question: "保护数据隐私是AI发展的重要前提，需要确保数据使用的合法性与透明性。",
    options: ["正确", "错误"],
    correctAnswer: 0 // 正确
  },
  {
    id: 21,
    question: "物联网（IoT）最简单的定义是什么？",
    options: [
      "只有电脑联网",
      "万物互联，物与物交换信息", 
      "只能用手机上网",
      "只连接工业机器"
    ],
    correctAnswer: 1 // B. 万物互联，物与物交换信息
  },
  {
    id: 22,
    question: "你用手机远程控制家里的空调，这属于物联网在智能家居中的应用。",
    options: ["对", "错"],
    correctAnswer: 0 // 对
  },
  {
    id: 23,
    question: "智能手表能监测你的心率和睡眠，它属于哪类IoT设备？",
    options: ["工业机器", "可穿戴设备", "城市路灯", "农业传感器"],
    correctAnswer: 1 // B. 可穿戴设备
  },
  {
    id: 24,
    question: "工业物联网（IIoT）主要关注生活便利性，比如帮你看孩子。",
    options: ["对", "错"],
    correctAnswer: 1 // 错
  },
  {
    id: 25,
    question: "下列哪个不属于物联网的网络连接技术？",
    options: ["Wi-Fi", "蓝牙", "5G", "鼠标垫"],
    correctAnswer: 3 // D. 鼠标垫
  },
  {
    id: 26,
    question: "IoT和IIoT的核心区别之一是？",
    options: [
      "IoT用于生活，IIoT用于工业严苛环境",
      "IoT更贵",
      "IIoT不需要网",
      "没有任何区别"
    ],
    correctAnswer: 0 // A. IoT用于生活，IIoT用于工业严苛环境
  },
  {
    id: 27,
    question: "工业物联网（IIoT）最核心的目标是？",
    options: [
      "娱乐员工",
      "提高效率与自动化", 
      "增加聊天功能",
      "美化工厂环境"
    ],
    correctAnswer: 1 // B. 提高效率与自动化
  },
  {
    id: 28,
    question: "在工厂里，IIoT可以预测设备什么时候坏，实现预测性维护。",
    options: ["对", "错"],
    correctAnswer: 0 // 对
  },
  {
    id: 29,
    question: "相比智能家居，工业物联网对数据的准确性和安全性要求更高。",
    options: ["对", "错"],
    correctAnswer: 0 // 对
  },
  {
    id: 30,
    question: "云平台和大数据分析属于物联网架构中的底层。",
    options: ["对", "错"],
    correctAnswer: 1 // 错
  },
  {
    id: 31,
    question: "自动化实施的四步法闭环，第一步通常是？",
    options: [
      "开发 (Build)",
      "设计 (Design)", 
      "部署 (Deploy)",
      "放弃 (Give up)"
    ],
    correctAnswer: 1 // B. 设计 (Design)
  },
  {
    id: 32,
    question: "Garbage In, Garbage Out的意思是，如果流程本身很乱，自动化后只会加速混乱，所以必须先优化流程。",
    options: ["对", "错"],
    correctAnswer: 0 // 对
  },
  {
    id: 33,
    question: "在测试阶段，你需要模拟什么情况？",
    options: [
      "一切顺利的情况",
      "各种异常情况（压力测试）", 
      "电脑关机的情况",
      "不测试直接上线"
    ],
    correctAnswer: 1 // B. 各种异常情况（压力测试）
  },
  {
    id: 34,
    question: "自动化的核心原理IPO模型指的是？",
    options: [
      "Initial - Public - Offering",
      "Input (输入) - Process (处理) - Output (输出)", 
      "Internet - Protocol - Open",
      "iPhone - iPad - Others"
    ],
    correctAnswer: 1 // B. Input - Process - Output
  },
  {
    id: 35,
    question: "部署（Deploy）之后，项目就彻底结束了，不需要再监控。",
    options: ["对", "错"],
    correctAnswer: 1 // 错
  },
  {
    id: 36,
    question: "在设计阶段，你的装备图纸通常是指？",
    options: ["详尽的流程图", "员工名单", "采购发票", "电脑壁纸"],
    correctAnswer: 0 // A. 详尽的流程图
  },
  {
    id: 37,
    question: "自动化实施之前，进行流程标准化是磨刀不误砍柴工。",
    options: ["对", "错"],
    correctAnswer: 0 // 对
  },
  {
    id: 38,
    question: "测试时的关键考量包括？",
    options: [
      "网页打不开怎么办？",
      "文件不存在怎么办？", 
      "模拟压力环境",
      "以上都是"
    ],
    correctAnswer: 3 // D. 以上都是
  },
  {
    id: 39,
    question: "自动化的铸造工坊指的是？",
    options: [
      "购买电脑的地方",
      "项目实施阶段", 
      "招聘员工",
      "休息室"
    ],
    correctAnswer: 0 // A. 开发 (Build)
  },
  {
    id: 40,
    question: "只要会写代码，不需要设计流程图也能做好复杂的自动化。",
    options: ["对", "错"],
    correctAnswer: 1 // 错
  },
  {
    id: 41,
    question: "数字孪生这一思想最早起源于哪个领域？",
    options: [
      "电子游戏开发",
      "社交媒体网络", 
      "航空航天（NASA）",
      "智慧农业"
    ],
    correctAnswer: 2 // C. 航空航天（NASA）
  },
  {
    id: 42,
    question: "数字孪生就是给物体拍一张3D照片，不需要实时的数据交互。",
    options: ["对", "错"],
    correctAnswer: 1 // 错
  },
  {
    id: 43,
    question: "数字孪生体被称为数字生命的蓝图，其四大典型特征不包括？",
    options: ["实时交互", "先知先觉", "共生共智", "完全静止"],
    correctAnswer: 3 // D. 完全静止
  },
  {
    id: 44,
    question: "数化保真意味着数字孪生体要真实呈现物理实体的各项指标，并反映其变化。",
    options: ["对", "错"],
    correctAnswer: 0 // 对
  },
  {
    id: 45,
    question: "2010年，正式定义数字孪生为独立概念的机构是？",
    options: ["NASA", "ISO", "IEEE", "谷歌"],
    correctAnswer: 0 // A. NASA
  },
  {
    id: 46,
    question: "数字孪生的体系架构通常是自下而上构建的，最底层是？",
    options: ["物理实体/感知层", "数据层", "运算层", "应用层"],
    correctAnswer: 0 // A. 物理实体/感知层
  },
  {
    id: 47,
    question: "在数字孪生架构中，应用层负责高精度数据的采集和传输。",
    options: ["对", "错"],
    correctAnswer: 1 // 错
  },
  {
    id: 48,
    question: "物联网（IoT）在数字孪生中的主要作用是？",
    options: [
      "玩游戏",
      "承载数据采集与传输，实现泛在连接", 
      "进行复杂的3D渲染",
      "替代人工智能"
    ],
    correctAnswer: 1 // B. 承载数据采集与传输
  },
  {
    id: 49,
    question: "VR（虚拟现实）技术的作用是模拟可交互的虚拟空间。",
    options: ["对", "错"],
    correctAnswer: 0 // 对
  },
  {
    id: 50,
    question: "云边端协同的工作流程中，边缘端主要负责？",
    options: [
      "深度学习训练",
      "全局数据存储", 
      "轻量计算与轻量模型推理",
      "无论什么都传给云端"
    ],
    correctAnswer: 2 // C. 轻量计算与轻量模型推理
  }
];