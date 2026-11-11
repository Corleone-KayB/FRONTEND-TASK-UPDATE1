export type TestCategory = "Anxiety" | "Stress" | "Depression" | "ADHD" | "OCD";
export type SeverityLevel =
  | "Normal"
  | "Minimal"
  | "Mild"
  | "Moderate"
  | "Severe"
  | "Extremely Severe"
  | "Subclinical"
  | "Extreme"
  | "Not consistent"
  | "Consistent";

export interface TestDefinition {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  frequency: string;
  durationMinutes: number;
  questions: number;
  instructions: string;
  answers: { label: string; value: number }[];
  items: string[];
  scoreKind: "gad7" | "dass" | "asrs" | "cybocs";
}

export interface TestResult {
  rawScore: number;
  displayScore: string;
  maxScore: string;
  severity: SeverityLevel;
  label: string;
  interpretation: string;
  extras?: { label: string; value: string }[];
}

const DASS_ANSWERS = [
  { label: "Did not apply to me at all", value: 0 },
  { label: "Applied to me to some degree, or some of the time", value: 1 },
  { label: "Applied to me to a considerable degree, or a good part of time", value: 2 },
  { label: "Applied to me very much, or most of the time", value: 3 },
];

export const TESTS: TestDefinition[] = [
  {
    id: "gad7",
    name: "Anxiety",
    description: "Measures generalised anxiety disorder severity over the past 2 weeks.",
    category: "Anxiety",
    frequency: "Every 2 weeks",
    durationMinutes: 5,
    questions: 7,
    instructions:
      "Over the last 2 weeks, how often have you been bothered by the following problems?",
    answers: [
      { label: "Not at all", value: 0 },
      { label: "Several days", value: 1 },
      { label: "Over half the days", value: 2 },
      { label: "Nearly every day", value: 3 },
    ],
    items: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid as if something awful might happen",
    ],
    scoreKind: "gad7",
  },
  {
    id: "dass21-anxiety",
    name: "Physical anxiety",
    description:
      "Assesses autonomic arousal, situational anxiety and subjective anxious affect over the past week.",
    category: "Anxiety",
    frequency: "Every 2 weeks",
    durationMinutes: 5,
    questions: 7,
    instructions: "Read each statement and select how much it applied to you over the past week.",
    answers: DASS_ANSWERS,
    items: [
      "I was aware of dryness of my mouth.",
      "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion).",
      "I experienced trembling (e.g. in the hands).",
      "I was worried about situations in which I might panic and make a fool of myself.",
      "I felt I was close to panic.",
      "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat).",
      "I felt scared without any good reason.",
    ],
    scoreKind: "dass",
  },
  {
    id: "dass21-stress",
    name: "Stress",
    description:
      "Assesses difficulty relaxing, nervous arousal, irritability and over-reactivity over the past week.",
    category: "Stress",
    frequency: "Every 2 weeks",
    durationMinutes: 5,
    questions: 7,
    instructions: "Read each statement and select how much it applied to you over the past week.",
    answers: DASS_ANSWERS,
    items: [
      "I found it hard to wind down.",
      "I tended to over-react to situations.",
      "I felt that I was using a lot of nervous energy.",
      "I found myself getting agitated.",
      "I found it difficult to relax.",
      "I was intolerant of anything that kept me from getting on with what I was doing.",
      "I felt that I was rather touchy.",
    ],
    scoreKind: "dass",
  },
  {
    id: "dass21-depression",
    name: "Depression",
    description:
      "Assesses hopelessness, anhedonia, low self-worth and lack of motivation over the past week.",
    category: "Depression",
    frequency: "Every 2 weeks",
    durationMinutes: 5,
    questions: 7,
    instructions: "Read each statement and select how much it applied to you over the past week.",
    answers: DASS_ANSWERS,
    items: [
      "I could not seem to experience any positive feeling at all.",
      "I found it difficult to work up the initiative to do things.",
      "I felt that I had nothing to look forward to.",
      "I felt down-hearted and blue.",
      "I was unable to become enthusiastic about anything.",
      "I felt I was not worth much as a person.",
      "I felt that life was meaningless.",
    ],
    scoreKind: "dass",
  },
  {
    id: "asrs",
    name: "Focus & attention",
    description:
      "Screens for ADHD symptoms in adults based on DSM-IV criteria over the past 6 months.",
    category: "ADHD",
    frequency: "Every month",
    durationMinutes: 5,
    questions: 18,
    instructions:
      "Rate yourself on each of the criteria shown based on how you have felt and conducted yourself over the past 6 months.",
    answers: [
      { label: "Never", value: 0 },
      { label: "Rarely", value: 1 },
      { label: "Sometimes", value: 2 },
      { label: "Often", value: 3 },
      { label: "Very Often", value: 4 },
    ],
    items: [
      "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?",
      "How often do you have difficulty getting things in order when you have to do a task that requires organization?",
      "How often do you have problems remembering appointments or obligations?",
      "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?",
      "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?",
      "How often do you feel overly active and compelled to do things, like you were driven by a motor?",
      "How often do you make careless mistakes when you have to work on a boring or difficult project?",
      "How often do you have difficulty keeping your attention when you are doing boring or repetitive work?",
      "How often do you have difficulty concentrating on what people say to you, even when they are speaking to you directly?",
      "How often do you misplace or have difficulty finding things at home or at work?",
      "How often are you distracted by activity or noise around you?",
      "How often do you leave your seat in meetings or other situations in which you are expected to remain seated?",
      "How often do you feel restless or fidgety?",
      "How often do you have difficulty unwinding and relaxing when you have time to yourself?",
      "How often do you find yourself talking too much when you are in social situations?",
      "When you are in a conversation, how often do you find yourself finishing the sentences of the people you are talking to, before they can finish them themselves?",
      "How often do you have difficulty waiting your turn in situations when turn taking is required?",
      "How often do you interrupt others when they are busy?",
    ],
    scoreKind: "asrs",
  },
  {
    id: "cybocs",
    name: "OCD",
    description:
      "Measures obsessive compulsive symptom severity including obsessions and compulsions.",
    category: "OCD",
    frequency: "Every 2 weeks",
    durationMinutes: 10,
    questions: 10,
    instructions: "Please rate the average occurrence of each item during the prior week.",
    answers: [
      { label: "None", value: 0 },
      { label: "Mild", value: 1 },
      { label: "Moderate", value: 2 },
      { label: "Severe", value: 3 },
      { label: "Extreme", value: 4 },
    ],
    items: [
      "How much of your time is occupied by obsessive thoughts? (None = 0 hrs/day | Mild = less than 1 hr | Moderate = 1-3 hrs | Severe = 3-8 hrs | Extreme = more than 8 hrs/day)",
      "How much do obsessive thoughts interfere with your daily life or activities?",
      "How much distress do your obsessive thoughts cause you?",
      "How hard do you try to resist your obsessive thoughts?",
      "How much control do you have over your obsessive thoughts?",
      "How much time do you spend performing compulsive behaviors?",
      "How much do compulsive behaviors interfere with your daily life or activities?",
      "How distressed would you feel if prevented from carrying out your compulsive behaviors?",
      "How hard do you try to resist your compulsive behaviors?",
      "How much control do you have over your compulsive behaviors?",
    ],
    scoreKind: "cybocs",
  },
];

export function getTestById(id: string) {
  return TESTS.find((test) => test.id === id);
}

function sumAnswers(answers: Record<number, number>) {
  return Object.values(answers).reduce((total, value) => total + value, 0);
}

function interpret(level: SeverityLevel, topic: string) {
  const copy: Record<SeverityLevel, string> = {
    Normal: `Your responses fall in the typical range for ${topic}. Keep noticing how you feel, and reach out if things change.`,
    Minimal: `Your responses suggest minimal ${topic}. This is a gentle snapshot, not a diagnosis — support is still available if you want it.`,
    Mild: `Your responses suggest mild ${topic}. Many people feel better with small routines, rest, and talking with someone they trust.`,
    Moderate: `Your responses suggest moderate ${topic}. This can be a good moment to connect with a therapist who can help you make sense of what you are carrying.`,
    Severe: `Your responses suggest severe ${topic}. You do not have to manage this alone — a licensed therapist can help you take the next step.`,
    "Extremely Severe": `Your responses suggest extremely severe ${topic}. Please consider speaking with a mental health professional as soon as you can. If you need urgent support, use the crisis line in the app.`,
    Subclinical: `Your responses are in a subclinical range for ${topic}. Symptoms may be present but not strongly interfering right now.`,
    Extreme: `Your responses suggest extreme ${topic}. Please consider professional support promptly, especially if daily life feels hard to manage.`,
    "Not consistent": `Your primary-screener answers are not highly consistent with ADHD. This does not rule anything out — a clinician can still help if you have concerns.`,
    Consistent: `Your primary-screener answers are highly consistent with ADHD. Further evaluation with a qualified clinician is recommended.`,
  };
  return copy[level];
}

export function scoreTest(test: TestDefinition, answers: Record<number, number>): TestResult {
  if (test.scoreKind === "gad7") {
    const rawScore = sumAnswers(answers);
    const severity: SeverityLevel =
      rawScore <= 4 ? "Minimal" : rawScore <= 9 ? "Mild" : rawScore <= 14 ? "Moderate" : "Severe";
    return {
      rawScore,
      displayScore: String(rawScore),
      maxScore: "21",
      severity,
      label: `${severity} Anxiety`,
      interpretation: interpret(severity, "anxiety"),
    };
  }

  if (test.id === "dass21-anxiety") {
    const rawScore = sumAnswers(answers) * 2;
    const severity: SeverityLevel =
      rawScore <= 7
        ? "Normal"
        : rawScore <= 9
          ? "Mild"
          : rawScore <= 14
            ? "Moderate"
            : rawScore <= 19
              ? "Severe"
              : "Extremely Severe";
    return {
      rawScore,
      displayScore: String(rawScore),
      maxScore: "42",
      severity,
      label: `${severity} Anxiety`,
      interpretation: interpret(severity, "anxiety"),
    };
  }

  if (test.id === "dass21-stress") {
    const rawScore = sumAnswers(answers) * 2;
    const severity: SeverityLevel =
      rawScore <= 14
        ? "Normal"
        : rawScore <= 18
          ? "Mild"
          : rawScore <= 25
            ? "Moderate"
            : rawScore <= 33
              ? "Severe"
              : "Extremely Severe";
    return {
      rawScore,
      displayScore: String(rawScore),
      maxScore: "42",
      severity,
      label: `${severity} Stress`,
      interpretation: interpret(severity, "stress"),
    };
  }

  if (test.id === "dass21-depression") {
    const rawScore = sumAnswers(answers) * 2;
    const severity: SeverityLevel =
      rawScore <= 9
        ? "Normal"
        : rawScore <= 13
          ? "Mild"
          : rawScore <= 20
            ? "Moderate"
            : rawScore <= 27
              ? "Severe"
              : "Extremely Severe";
    return {
      rawScore,
      displayScore: String(rawScore),
      maxScore: "42",
      severity,
      label: `${severity} Depression`,
      interpretation: interpret(severity, "low mood"),
    };
  }

  if (test.scoreKind === "asrs") {
    const indicators = [0, 1, 2, 3, 4, 5].filter((index) => (answers[index] ?? 0) >= 3).length;
    const consistent = indicators >= 4;
    return {
      rawScore: indicators,
      displayScore: String(indicators),
      maxScore: "6 primary indicators",
      severity: consistent ? "Consistent" : "Not consistent",
      label: consistent
        ? "Symptoms highly consistent with ADHD — further evaluation recommended"
        : "Symptoms not highly consistent with ADHD",
      interpretation: interpret(
        consistent ? "Consistent" : "Not consistent",
        "attention and activity"
      ),
      extras: [
        { label: "Primary indicators", value: `${indicators} out of 6 primary indicators present` },
      ],
    };
  }

  const obsession = [0, 1, 2, 3, 4].reduce((total, index) => total + (answers[index] ?? 0), 0);
  const compulsion = [5, 6, 7, 8, 9].reduce((total, index) => total + (answers[index] ?? 0), 0);
  const rawScore = obsession + compulsion;
  const severity: SeverityLevel =
    rawScore <= 7
      ? "Subclinical"
      : rawScore <= 15
        ? "Mild"
        : rawScore <= 23
          ? "Moderate"
          : rawScore <= 31
            ? "Severe"
            : "Extreme";
  return {
    rawScore,
    displayScore: String(rawScore),
    maxScore: "40",
    severity,
    label: `${severity} OCD symptoms`,
    interpretation: interpret(severity, "obsessive-compulsive symptoms"),
    extras: [
      { label: "Obsession subtotal", value: `${obsession} / 20` },
      { label: "Compulsion subtotal", value: `${compulsion} / 20` },
    ],
  };
}

export function testResultStorageKey(id: string) {
  return `mindora-test-result-${id}`;
}
