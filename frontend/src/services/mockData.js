
// Mock modules for course detail page
export const MOCK_COURSE_MODULES = [
  {
    id: 1,
    title: "Performance Optimization",
    lessons: [
      { id: 1, title: "Intro to Performance" },
      { id: 2, title: "React Best Practices" },
      { id: 3, title: "Profiling Tools" },
    ],
  },
  {
    id: 2,
    title: "Advanced Patterns",
    lessons: [
      { id: 1, title: "Compound Components" },
      { id: 2, title: "Render Props" },
    ],
  },
];

// Mock contents for course detail page
export const MOCK_COURSE_CONTENTS = [
  {
    id: 1,
    moduleNumber: 6,
    moduleTitle: "Performance Optimization",
    moduleType: "Video",
    moduleDuration: "45m",
    moduleStatus: "completed",
    // items: [
    //   { id: 1, title: "React Profiler", time: "20m", type: "video", status: "completed" },
    //   { id: 2, title: "Memoization Techniques", time: "25m", type: "video", status: "active" },
    //   { id: 3, title: "Code Splitting", time: "15m", type: "video", status: "pending" },
    //   { id: 4, title: "Virtual Lists", time: "10m", type: "video", status: "pending" },
    //   { id: 5, title: "Module Quiz", time: "5m", type: "quiz", status: "pending" },
    // ],
  },
  {
    id: 2,
    moduleNumber: 7,
    moduleTitle: "Introduction to Advanced Patterns",
    moduleType: "Video",
    moduleDuration: "45m",
    moduleStatus: "completed",
  },
  {
    id: 3,
    moduleNumber: 8,
    moduleTitle: "Introduction to Advanced Patterns",
    moduleType: "Reading",
    moduleDuration: "45m",
    moduleStatus: "completed",
    content: `Structured gripped tape invisible moulded cups for sauppor firm hold strong powermesh front liner sport detail. Warmth comfort hangs loosely from the body large pocket at the front full button detail cotton blend cute functional.

Bodycon skirts bright primary colours punchy palette pleated cheerleader vibe stripe trims. Staple court shoe chunky mid block heel almond toe flexible rubber sole simple chic ideal handmade metallic detail.

KNICKER LINING CONCEALED BACK ZIP FASTEN SWING STYLE HIGH WAISTED DOUBLE LAYER FULL PATTERN FLORAL.

Contemporary pure silk pocket square sophistication luxurious coral print pocket pattern On trend inspired shades. Striking pewter studded epaulette silver zips inner drawstring waist channel urban single-breasted jacket.

Engraved attention to detail elegant with neutral colours chemo quartz leather strap fastens with a pin a buckle clasp. Workwear bow detailing a slingback buckle strap stiletto heel timeless go-to shoe sophistication elegant sheer.`,
  },
  {
    id: 4,
    moduleNumber: 9,
    moduleTitle: "Introduction to Advanced Patterns",
    moduleType: "Reading",
    moduleDuration: "45m",
    moduleStatus: "completed",
    content: `Foam padding in the insoles leather finest quality staple flat slip-on design pointed toe off-duty shoe. Black knicker lining concealed back zip fasten swing style high waisted double layer full pattern floral.

Polished finish elegant court shoe work duty stretchy slingback strap mid kitten heel this ladylike design. Eget senatus tellis venomatis. Donec odo tempus. Felis arcu pretium mettis nullam quam aenean sociis quis sem neque viti liberto.

EU RIDICULUS FRINGILLA AENEAN

Venenatis nullam fringilla pretium magnis aliquam nunc vulputate integer augue ultricies cras. Eget viverra feugiat cras ut. Sit natoque montes tempus ligula eget vitae pede rhoncus maecenas consectetuer commodo condimentum aenean.

State Machines are powerful tools for managing complex application states. They provide a structured approach to handling state transitions and ensure predictable behavior in your applications.

Finite Automata help model computational processes and are fundamental to understanding how state machines work in practice.`,
  },
  {
    id: 5,
    moduleNumber: 10,
    moduleTitle: "Introduction to Advanced Patterns",
    moduleType: "Video",
    moduleDuration: "45m",
    moduleStatus: "completed",
  },
  {
    id: 6,
    moduleNumber: 11,
    moduleTitle: "Introduction to Advanced Patterns",
    moduleType: "Video",
    moduleDuration: "45m",
    moduleStatus: "completed",
  },
  {
    id: 7,
    moduleNumber: 12,
    moduleTitle: "Testing Advanced Patterns",
    moduleType: "Video",
    moduleDuration: "1h 60m",
    moduleStatus: "locked",  
  },
  {
    id: 8,
    moduleNumber: 13,
    moduleTitle: "Testing Advanced Patterns",
    moduleType: "Reading",
    moduleDuration: "1h 60m",
    moduleStatus: "locked",
    content: `See-through delicate embroidered organza blue lining luxury acetate-mix stretch pleat detailing. Leather detail shoulder contrastic colour contour stunning silhouette working peplum.

Statement buttons cover-up tweeds patch pockets perennial lapel collar flap chest pockets topline stitching cropped jacket. Effortless comfortable full leather lining eye-catching unique detail to the toe low 'cut-away' sides clean and sleek.

E2E Testing with Cypress provides comprehensive end-to-end testing capabilities. It allows you to test your entire application flow from the user's perspective, ensuring that all components work together seamlessly.

Visual Regression Testing helps catch unintended visual changes in your UI. By comparing screenshots of your application before and after changes, you can ensure visual consistency across updates.

Performance Testing is crucial for ensuring your application meets performance requirements. It helps identify bottlenecks and optimize critical paths in your application.

CI/CD Test Pipelines automate the testing process, ensuring that tests run automatically on every code change. This helps catch issues early and maintain code quality throughout the development lifecycle.`,   
  },
];
// Mock assessment instructions data
export const MOCK_ASSESSMENT_DATA = {
  subtitle: "Please read all instructions carefully before starting your assessment",
  notice: {
    title: "Important Notice",
    description: "Once you start the assessment, you must complete it in one sitting. Make sure you have enough time and a stable internet connection before beginning.",
  },
  instructionCards: [
    {
      icon: "Timer",
      iconColor: "#9C2EDB",
      iconBg: "#9C2EDB1A",
      title: "Time Limit",
      description: "You have 30 minutes to complete the assessment. The timer will start once you begin.",
    },
    {
      icon: "HelpCircle",
      iconColor: "#FD8C02",
      iconBg: "#FD8C021A",
      title: "Question Format",
      description: "The assessment contains 20 multiple-choice questions. Each question has only one correct answer.",
    },
    {
      icon: "CheckCircle2",
      iconColor: "#46BD84",
      iconBg: "#46BD841A",
      title: "Passing Score",
      description: "You need to score at least 70% to pass. This means you must answer 14 or more questions correctly.",
    },
    {
      icon: "Ban",
      iconColor: "#EF4444",
      iconBg: "#EF44441A",
      title: "No Going Back",
      description: "Once you submit an answer, you cannot go back to change it. Review your answer before proceeding.",
    },
    {
      icon: "ShieldCheck",
      iconColor: "#3B82F6",
      iconBg: "#3B82F61A",
      title: "Integrity Policy",
      description: "This is a closed-book assessment. External help or resources are not permitted during the test.",
    },
    {
      icon: "Wifi",
      iconColor: "#9C2EDB",
      iconBg: "#9C2EDB1A",
      title: "Technical Requirements",
      description: "Ensure stable internet connection. Do not refresh or close the browser during the assessment.",
    },
  ],
  checklist: {
    title: "Pre-Assessment Checklist",
    subtitle: "Read the instructions carefully before starting the Assessment.",
    items: [
      "I have completed all course modules",
      "I have a stable internet connection",
      "I will not use any external resources",
      "I have at least 30 minutes of uninterrupted time",
      "I understand the assessment rules and guidelines",
    ],
  },
  buttonText: "Start Assessment",
};

// Mock assessment quiz questions
export const MOCK_ASSESSMENT_QUESTIONS = [
  { id: 1, question: "What is the primary purpose of workplace safety training?", options: ["To meet the legal requirements only", "To prevent accidents and ensure employee well-being", "To reduce company insurance costs", "To fulfill HR documentation requirements"], correctAnswer: 1 },
  // { id: 2, question: "Which of the following is a key benefit of continuous learning in the workplace?", options: ["It guarantees immediate promotion", "It helps employees adapt to changing industry trends", "It replaces the need for formal education", "It eliminates the need for performance reviews"], correctAnswer: 1 },
  // { id: 3, question: "What does 'ergonomics' refer to in a workplace setting?", options: ["The study of workplace politics", "Designing workspaces to fit the user's needs", "A type of management strategy", "The process of hiring new employees"], correctAnswer: 1 },
  // { id: 4, question: "Which communication style is most effective in a professional environment?", options: ["Passive communication", "Aggressive communication", "Assertive communication", "Passive-aggressive communication"], correctAnswer: 2 },
  // { id: 5, question: "What is the recommended approach when encountering a workplace hazard?", options: ["Ignore it if it doesn't affect you directly", "Report it immediately to the appropriate authority", "Wait for someone else to report it", "Try to fix it yourself without training"], correctAnswer: 1 },
  // { id: 6, question: "What is the purpose of a fire evacuation plan?", options: ["To assign blame in case of fire", "To ensure orderly and safe evacuation during emergencies", "To reduce insurance premiums", "To satisfy building inspection requirements only"], correctAnswer: 1 },
  // { id: 7, question: "Which of the following best describes 'active listening'?", options: ["Hearing words without processing them", "Fully concentrating, understanding, and responding to a speaker", "Interrupting to share your own thoughts", "Listening only to information that benefits you"], correctAnswer: 1 },
  // { id: 8, question: "What is the main goal of diversity and inclusion training?", options: ["To enforce strict quotas in hiring", "To foster a respectful and equitable work environment", "To eliminate all differences among employees", "To comply with government mandates only"], correctAnswer: 1 },
  // { id: 9, question: "What should you do if you witness harassment in the workplace?", options: ["Ignore it as it's not your concern", "Report it through the proper channels", "Confront the harasser publicly", "Discuss it only with coworkers"], correctAnswer: 1 },
  // { id: 10, question: "What is the purpose of a performance review?", options: ["To find reasons to terminate employees", "To provide feedback and set goals for improvement", "To compare employees against each other", "To fulfill a bureaucratic requirement"], correctAnswer: 1 },
  // { id: 11, question: "Which of the following is an example of professional development?", options: ["Watching entertainment videos at work", "Attending industry conferences and workshops", "Taking extended lunch breaks", "Socializing exclusively with colleagues"], correctAnswer: 1 },
  // { id: 12, question: "What does 'time management' primarily involve?", options: ["Working longer hours to complete tasks", "Planning and prioritizing tasks effectively", "Delegating all work to others", "Multitasking on every project simultaneously"], correctAnswer: 1 },
  // { id: 13, question: "What is the significance of data privacy in the workplace?", options: ["It only matters for IT departments", "It protects sensitive information from unauthorized access", "It slows down business operations", "It is optional for small companies"], correctAnswer: 1 },
  // { id: 14, question: "Which leadership style encourages team participation in decision-making?", options: ["Autocratic leadership", "Democratic leadership", "Laissez-faire leadership", "Transactional leadership"], correctAnswer: 1 },
  // { id: 15, question: "What is the first step in conflict resolution?", options: ["Assigning blame to one party", "Identifying and understanding the issue", "Ignoring the conflict until it resolves itself", "Escalating immediately to upper management"], correctAnswer: 1 },
  // { id: 16, question: "Why is feedback important in a professional setting?", options: ["It allows managers to assert dominance", "It helps individuals and teams improve performance", "It is only necessary during annual reviews", "It creates competition among employees"], correctAnswer: 1 },
  // { id: 17, question: "What is a key characteristic of effective teamwork?", options: ["Individual members working in isolation", "Open communication and mutual respect", "One person making all the decisions", "Avoiding disagreements at all costs"], correctAnswer: 1 },
  // { id: 18, question: "What does 'compliance training' typically cover?", options: ["Personal hobbies of employees", "Laws, regulations, and company policies employees must follow", "Advanced technical skills only", "Social media marketing strategies"], correctAnswer: 1 },
  // { id: 19, question: "What is the benefit of setting SMART goals?", options: ["They are vague enough to be easily achieved", "They provide clear, measurable, and achievable objectives", "They eliminate the need for deadlines", "They focus only on long-term outcomes"], correctAnswer: 1 },
  // { id: 20, question: "Which of the following is a sign of a healthy workplace culture?", options: ["High employee turnover", "Open communication and employee recognition", "Frequent conflicts without resolution", "Rigid hierarchies with no flexibility"], correctAnswer: 1 },
  // { id: 21, question: "What is the role of a mentor in professional development?", options: ["To do the mentee's work for them", "To guide, support, and share knowledge with the mentee", "To evaluate the mentee's salary", "To replace formal training programs"], correctAnswer: 1 },
  // { id: 22, question: "Why is it important to document workplace incidents?", options: ["To create unnecessary paperwork", "To maintain records for analysis, prevention, and legal purposes", "To embarrass the employees involved", "Documentation is not important"], correctAnswer: 1 },
  // { id: 23, question: "What is 'emotional intelligence' in the workplace?", options: ["The ability to suppress all emotions", "The ability to recognize, understand, and manage emotions effectively", "A measure of IQ score", "A personality trait that cannot be developed"], correctAnswer: 1 },
  // { id: 24, question: "What is the purpose of onboarding for new employees?", options: ["To overwhelm them with information on day one", "To help them integrate smoothly into the organization", "To test their ability to handle pressure", "To assign them the most difficult tasks immediately"], correctAnswer: 1 },
  // { id: 25, question: "Which of the following promotes a safe digital workspace?", options: ["Sharing passwords with trusted colleagues", "Using strong passwords and enabling two-factor authentication", "Clicking on all email links to stay informed", "Disabling antivirus software for faster performance"], correctAnswer: 1 },
];

// Mock assessment result screens
export const MOCK_ASSESSMENT_RESULTS = {
  pass: {
    title: "Your Score:",
    message: "Congratulations! You have met the required passing criteria. Well done on completing the assessment successfully. Your effort and dedication have paid off, and you've demonstrated a strong understanding of the course content.",
    subMessage: "Your course has now been marked as completed. You can continue exploring more courses to keep building your skills.",
    buttonText: "Back to Courses",
  },
  fail: {
    title: "Your Score:",
    message: "Unfortunately, you did not meet the required passing criteria this time.",
    attemptsInfo: "You can make up to 3 attempts within 24 hours.",
    contactInfo: "If you're still unsuccessful after these attempts, please contact the admin for approval of reattempts",
    subMessage: "Until then, we recommend reviewing the course content or exploring other available courses to strengthen your understanding.",
    primaryButtonText: "Try Again",
    secondaryButtonText: "Back to Courses",
  },
  passingScore: 0,
};

// Mock instructions for PDF/text course content
export const MOCK_COURSE_INSTRUCTIONS = [
  {
    type: "paragraph",
    content: "Structured gripped tape invisible moulded cups for sauppor firm hold strong powermesh front liner sport detail. Warmth comfort hange loosely from the body large pocket at the front full button detail cotton blend cute functional. Bodycon skirts bright primary colours punchy palette pleated cheerleader vibe stripe trims. Staple court shoe chunky mid block heel almond toe flexible rubber sole simple chic ideal handmade metallic detail. Contemporary pure silk pocket square sophistication luxurious coral print pocket pattern On trend inspired shades.",
  },
  {
    type: "paragraph",
    content: "Striking pewter studded epaulette silver zips inner drawstring waist channel urban single-breasted jacket. Engraved attention to detail elegant with neutral colours chemo quartz leather strap fastens with a pin a buckle clasp. Workwear bow detailing a slingback buckle strap stiletto heel timeless go-to shoe sophistication elegant sheer. Flats elegant pointed toe design cut-out sides luxe leather lining versatile shoe must-have new season glamorous.",
  },
  {
    type: "heading",
    content: "KNICKER LINING CONCEALED BACK ZIP FASTEN SWING STYLE HIGH WAISTED DOUBLE LAYER FULL PATTERN FLORAL.",
  },
  {
    type: "paragraph",
    content: "Foam padding in the insoles leather finest quality staple flat slip-on design pointed toe off-duty shoe. Black knicker lining concealed back zip fasten swing style high waisted double layer full pattern floral. Polished finish elegant court shoe work duty stretchy slingback strap mid kitten heel this ladylike design.",
  },
  {
    type: "paragraph",
    content: "Eget senatus tellis venomatis. Donec odo tempus. Felis arcu pretium mettis nullam quam aenean sociis quis sem neque viti liberto. Venenatis nullam fringilla pretium magnis aliquam nunc vulputate integer augue ultricies cras. Eget viverra feugiat cras ut. Sit natoque montes tempus ligula eget vitae pede rhoncus maecenas consectetuer commodo condimentum aenean.",
  },
  {
    type: "heading",
    content: "EU RIDICULUS FRINGILLA AENEAN",
  },
  {
    type: "paragraph",
    content: "Foam padding in the insoles leather finest quality staple flat slip-on design pointed toe off-duty shoe. Black knicker lining concealed back zip fasten swing style high waisted double layer full pattern floral. Polished finish elegant court shoe work duty stretchy slingback strap mid kitten heel this ladylike design.",
  },
  {
    type: "paragraph",
    content: "Eget senatus tellis venomatis. Donec odo tempus. Felis arcu pretium mettis nullam quam aenean sociis quis sem neque viti liberto. Venenatis nullam fringilla pretium magnis aliquam nunc vulputate integer augue ultricies cras. Eget viverra feugiat cras ut. Sit natoque montes tempus ligula eget vitae pede rhoncus maecenas consectetuer commodo condimentum aenean.",
  },
  {
    type: "list",
    items: [
      "Crisp fresh iconic elegant timeless clean perfume",
      "Neck straight sharp silhouette and dart detail",
      "Machine wash cold slim fit premium stretch selvedge denim comfortable low waist",
    ],
  },
  {
    type: "paragraph",
    content: "See-through delicate embroidered organza blue lining luxury acetate-mix stretch pleat detailing. Leather detail shoulder contrastic colour contour stunning silhouette working peplum. Statement buttons cover-up tweeds patch pockets perennial lapel collar flap chest pockets topline stitching cropped jacket. Effortless comfortable full leather lining eye-catching unique detail to the toe low 'cut-away' sides clean and sleek. Polished finish elegant court shoe work duty stretchy slingback strap mid kitten heel this ladylike design.",
  },
];

// Mock courses for each category (for /courses/[category] pages)
export const MOCK_COURSES_CATEGORY_LIST = {
  mandatory: [
    {
      id: 1,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: true,
      progress: 75,
      time: '36 mins',
      contentType: 'video',
      content: '',
      certificationGenerated: true,
    },
    {
      id: 2,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 75,
      time: '36 mins',
      contentType: 'pdf',
      content: `Structured gripped tape invisible moulded cups for sauppor firm hold strong powermesh front liner sport detail. Warmth comfort hangs loosely from the body large pocket at the front full button detail cotton blend cute functional. Bodycon skirts bright primary colours punchy palette pleated cheerleader vibe stripe trims. Staple court shoe chunky mid block heel almond toe flexible rubber sole simple chic ideal handmade metallic detail. Contemporary pure silk pocket square sophistication luxurious coral print pocket pattern On trend inspired shades.`,
    },
    {
      id: 3,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
      contentType: 'text',
    },
    {
      id: 4,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
      contentType: 'video',
    },
    {
      id: 5,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
      contentType: 'pdf',
      content: `Structured gripped tape invisible moulded cups for sauppor firm hold strong powermesh front liner sport detail. Warmth comfort hargo technology from the body.\n\nKicker lining concealed back zip fasten swing style high waisted double layer full pattern floral.\n\nEu ridiculus fringilla aenean.`,
    },
    {
      id: 6,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3fd9?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
      contentType: 'text',
      content: `Structured gripped tape invisible moulded cups for sauppor firm hold strong powermesh front liner sport detail. Warmth comfort hargo technology from the body.\n\nKicker lining concealed back zip fasten swing style high waisted double layer full pattern floral.\n\nEu ridiculus fringilla aenean.`,
    },
  ],
  orientation: [
    {
      id: 1,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: true,
      progress: 100,
      time: '36 mins',
    },
    {
      id: 2,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 75,
      time: '36 mins',
    },
    {
      id: 3,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
    },
    {
      id: 4,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
    },
    {
      id: 5,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
    },
    {
      id: 6,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3fd9?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
    },
  ],
  all: [
    {
      id: 1,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: true,
      progress: 100,
      time: '36 mins',
    },
    {
      id: 2,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 75,
      time: '36 mins',
    },
    {
      id: 3,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
    },
    {
      id: 4,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
    },
    {
      id: 5,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
    },
    {
      id: 6,
      title: 'Beginner’s Guide To Becoming A Professional Frontend Developer',
      image: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3fd9?w=800',
      duration: 8,
      modules: 12,
      learners: 36,
      completed: false,
      progress: 0,
      time: '36 mins',
    },
  ],
};
// Mock Data for Development
// Toggle this flag to switch between mock and real API
export const USE_MOCK_DATA = false; // Use real API data now that backend includes date_of_birth

// Helper to simulate API delay
export const mockDelay = (ms = 800) => 
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock Users Data
export const MOCK_USERS = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
  },
];

// Mock Auth Response
export const MOCK_AUTH_USER = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  token: 'mock-jwt-token-12345',
};

// Mock Products Data (example)
export const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Product 1',
    price: 99.99,
    description: 'This is product 1',
    image: 'https://via.placeholder.com/300',
  },
  {
    id: 2,
    name: 'Product 2',
    price: 149.99,
    description: 'This is product 2',
    image: 'https://via.placeholder.com/300',
  },
];

// Mock People Directory Data
export const MOCK_PEOPLE = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    company: 'AIA',
    title: 'Product Designer',
    department: 'Product',
    location: 'Los Angeles, CA',
    joinDate: '2026-01-10',
    yearsAtCompany: 5,
    employeeId: '25846245',
    phone: '+1 555-2101',
    email: 'sarah.mitchell@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahMitchell',
    isNew: true,
  },
  {
    id: 2,
    name: 'Garrett Crooks',
    company: 'AIA',
    title: 'Product Designer',
    department: 'Product',
    location: 'San Francisco, CA',
    joinDate: '2026-01-10',
    yearsAtCompany: 4,
    employeeId: '25846246',
    phone: '+1 555-2102',
    email: 'garrett.crooks@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GarrettCrooks',
    isNew: true,
  },
  {
    id: 3,
    name: 'Gust Rath',
    company: 'AIA',
    title: 'Product Designer',
    department: 'Product',
    location: 'San Francisco, CA',
    joinDate: '2026-01-10',
    yearsAtCompany: 3,
    employeeId: '25846247',
    phone: '+1 555-2103',
    email: 'gust.rath@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GustRath',
    isNew: true,
  },
  {
    id: 4,
    name: 'Stefan Huel',
    company: 'AIA',
    title: 'Product Designer',
    department: 'Product',
    location: 'San Francisco, CA',
    joinDate: '2026-01-10',
    yearsAtCompany: 2,
    employeeId: '25846248',
    phone: '+1 555-2104',
    email: 'stefan.huel@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StefanHuel',
    isNew: true,
  },
  {
    id: 5,
    name: 'Armando Stark',
    company: 'AIA',
    title: 'Product Designer',
    department: 'Product',
    location: 'San Francisco, CA',
    joinDate: '2026-01-10',
    yearsAtCompany: 6,
    employeeId: '25846249',
    phone: '+1 555-2105',
    email: 'armando.stark@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArmandoStark',
    isNew: true,
  },
  {
    id: 6,
    name: 'Jace Gibson',
    company: 'VEGA',
    title: 'Product Designer',
    department: 'Product',
    location: 'San Francisco, CA',
    joinDate: '2026-01-10',
    yearsAtCompany: 4,
    employeeId: '25846250',
    phone: '+1 555-2106',
    email: 'jace.gibson@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JaceGibson',
    isNew: false,
  },
  {
    id: 7,
    name: 'Oral Luelwitz',
    company: 'VEGA',
    title: 'Product Designer',
    department: 'Product',
    location: 'San Francisco, CA',
    joinDate: '2026-01-10',
    yearsAtCompany: 1,
    employeeId: '25846251',
    phone: '+1 555-2107',
    email: 'oral.luelwitz@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OralLuelwitz',
    isNew: false,
  },
  {
    id: 8,
    name: 'Harold Collins',
    company: 'VEGA',
    title: 'Product Designer',
    department: 'Product',
    location: 'San Francisco, CA',
    joinDate: '2026-01-10',
    yearsAtCompany: 3,
    employeeId: '25846252',
    phone: '+1 555-2108',
    email: 'harold.collins@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HaroldCollins',
    isNew: false,
  },
  {
    id: 9,
    name: 'Maya Patel',
    company: 'AIA',
    title: 'UX Researcher',
    department: 'Design',
    location: 'Austin, TX',
    joinDate: '2025-10-22',
    yearsAtCompany: 2,
    employeeId: '25846253',
    phone: '+1 555-2109',
    email: 'maya.patel@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MayaPatel',
    isNew: false,
  },
  {
    id: 10,
    name: 'Leo Fernandez',
    company: 'VEGA',
    title: 'Engineering Manager',
    department: 'Engineering',
    location: 'New York, NY',
    joinDate: '2024-08-12',
    yearsAtCompany: 7,
    employeeId: '25846254',
    phone: '+1 555-2110',
    email: 'leo.fernandez@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LeoFernandez',
    isNew: false,
  },
  {
    id: 11,
    name: 'Nina Yamaguchi',
    company: 'AIA',
    title: 'People Partner',
    department: 'Human Resources',
    location: 'Seattle, WA',
    joinDate: '2023-05-09',
    yearsAtCompany: 4,
    employeeId: '25846255',
    phone: '+1 555-2111',
    email: 'nina.yamaguchi@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinaYamaguchi',
    isNew: false,
  },
  {
    id: 12,
    name: 'Ethan Brooks',
    company: 'VEGA',
    title: 'QA Analyst',
    department: 'Quality Assurance',
    location: 'Denver, CO',
    joinDate: '2025-02-19',
    yearsAtCompany: 3,
    employeeId: '25846256',
    phone: '+1 555-2112',
    email: 'ethan.brooks@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EthanBrooks',
    isNew: false,
  },
];

export const MOCK_RESOURCES = [
  {
    id: 1,
    title: 'Remote Work Policy',
    tag: 'Human Resource',
    description: `
      <p><strong>Overview</strong> This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Eligibility</strong> Employees who have completed their probation period and whose role is suitable for remote work may apply. Eligibility is subject to manager approval and business requirements. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      <p><strong>Work Hours</strong> Remote employees are expected to be available during core business hours (9 AM - 3 PM) and respond to communications within a reasonable timeframe. Flexibility outside of core hours is permitted with manager approval. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Security & Data</strong> All company data and information must be handled securely when working remotely. Employees must use VPN connections, secure passwords, and follow all IT security protocols to protect sensitive information. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      This policy establishes the framework for remote work arrangements at our organization. It applies to all employees who have been approved for remote work, whether on a full-time, part-time, or occasional basis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Equipment & Workspace</strong> Employees should maintain a dedicated workspace that is safe, secure, and free from distractions. Equipment provided by the company remains company property and must be returned upon termination of employment or end of remote work arrangement. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Communication</strong> Employees must keep their calendars up to date, attend required meetings, and maintain regular check-ins with their managers. Any changes to availability should be communicated promptly. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    `,
    department: 'HR Department',
    date: '2026-01-15',
    type: 'Policy',
    category: 'policies',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 2,
    title: 'Expense Reimbursement Form',
    tag: 'Finance',
    description: 'Form to claim business-related expenses and instructions for submission.',
    department: 'Finance',
    date: '2025-12-01',
    type: 'Form',
    category: 'forms',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 3,
    title: 'Code of Conduct',
    tag: 'Company',
    description: `
      <p><strong>Overview</strong> Standards and behaviours expected from all employees to maintain a professional workplace. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Professionalism</strong> Employees are expected to act with integrity, respect, and consideration in all interactions with colleagues, clients, and partners. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Conflict of Interest</strong> Employees must disclose any potential conflicts of interest and avoid situations where personal interests could influence professional judgment. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Use of Company Resources</strong> Company resources should be used responsibly and for legitimate business purposes. Personal use should be limited and follow company policy. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Reporting Misconduct</strong> Any concerns about policy violations, ethical issues, or misconduct should be reported through the appropriate channels promptly. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    `,
    department: 'People & Culture',
    date: '2025-11-20',
    type: 'Policy',
    category: 'policies',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 4,
    title: 'New Starter Checklist',
    tag: 'HR',
    description: 'Checklist for onboarding new hires covering admin, IT access and welcome tasks.',
    department: 'People & Culture',
    date: '2026-02-01',
    type: 'Template',
    category: 'forms',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 5,
    title: 'Flexible Working Guidelines',
    tag: 'Human Resource',
    description: `
      <p><strong>Overview</strong> Policy outlining flexible working arrangements and the approval process for employees seeking adjusted schedules. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Eligibility</strong> Employees may request flexible hours or part-time arrangements subject to manager approval and operational needs. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Application Process</strong> Employees should submit requests using the formal flexible working form and provide justification and proposed schedule. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Review & Approval</strong> Managers will review requests considering team impact, role suitability, and fairness, providing responses within a reasonable timeframe. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    `,
    department: 'HR Department',
    date: '2025-10-10',
    type: 'Policy',
    category: 'policies',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 6,
    title: 'Travel Expense Form',
    tag: 'Finance',
    description: 'Form to claim travel expenses and per-diem rates.',
    department: 'Finance',
    date: '2025-09-05',
    type: 'Form',
    category: 'forms',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 7,
    title: 'Data Protection Policy',
    tag: 'Legal',
    description: `
      <p><strong>Overview</strong> Company rules for handling personal data and compliance with applicable data protection laws. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Scope</strong> This policy applies to all employees, contractors, and third parties processing company personal data. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Responsibilities</strong> Employees must follow data handling procedures, report breaches, and attend required data protection training. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Data Subject Rights</strong> Procedures are in place to respond to access, correction, and deletion requests from data subjects. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    `,
    department: 'Legal',
    date: '2025-08-12',
    type: 'Policy',
    category: 'policies',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 8,
    title: 'IT Access Request Template',
    tag: 'IT',
    description: 'Template for requesting system access for new hires and role changes.',
    department: 'IT',
    date: '2026-01-20',
    type: 'Template',
    category: 'forms',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 9,
    title: 'Health & Safety Manual',
    tag: 'Operations',
    description: `
      <p><strong>Overview</strong> Guidance on workplace safety, emergency procedures, and incident reporting to protect employees and visitors. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Workplace Safety</strong> Employees should follow safe work practices, use protective equipment, and report hazards immediately. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Emergency Procedures</strong> Clear evacuation routes, assembly points, and emergency contacts are maintained and communicated to all staff. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Incident Reporting</strong> All incidents must be reported through the incident management system for investigation and corrective action. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    `,
    department: 'Operations',
    date: '2024-12-15',
    type: 'Policy',
    category: 'policies',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 10,
    title: 'Performance Review Template',
    tag: 'People',
    description: 'Template used by managers for conducting performance reviews.',
    department: 'People & Culture',
    date: '2025-07-01',
    type: 'Template',
    category: 'forms',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 11,
    title: 'Sick Leave Policy',
    tag: 'HR',
    description: `
      <p><strong>Overview</strong> Procedures for reporting sick leave, notification expectations, and documentation requirements for absences. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Notification</strong> Employees should notify their manager as soon as possible when unable to work due to illness. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Documentation</strong> Medical certificates may be required for extended absences according to local regulations. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Return to Work</strong> Managers should conduct return-to-work discussions for prolonged absences to support reintegration. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    `,
    department: 'HR Department',
    date: '2025-06-18',
    type: 'Policy',
    category: 'policies',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 12,
    title: 'Expense Policy - International Travel',
    tag: 'Finance',
    description: `
      <p><strong>Overview</strong> Specific rules for international travel, expense limits, and currency reimbursement procedures. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Pre-Approval</strong> International travel must be pre-approved and budgeted through the manager and finance team. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Allowable Expenses</strong> Receipts are required for reimbursement; per-diem rules apply where specified. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Currency & Tax</strong> Reimbursements will be processed in company currency with applicable tax treatments applied. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    `,
    department: 'Finance',
    date: '2024-11-02',
    type: 'Policy',
    category: 'policies',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 13,
    title: 'Project Kickoff Checklist',
    tag: 'PMO',
    description: 'Checklist to ensure all stakeholders and technical requirements are ready at project start.',
    department: 'Project Management',
    date: '2025-05-22',
    type: 'Template',
    category: 'forms',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 14,
    title: 'Security Incident Report Form',
    tag: 'Security',
    description: 'Form to report security incidents and steps for escalation.',
    department: 'IT Security',
    date: '2026-01-05',
    type: 'Form',
    category: 'forms',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 15,
    title: 'Equal Opportunity Policy',
    tag: 'People',
    description: `
      <p><strong>Overview</strong> Company commitment to equal opportunity, diversity, and non-discrimination in employment practices. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Scope</strong> Applies to recruitment, promotion, training, and all employment conditions. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Reporting</strong> Concerns about discrimination or harassment should be reported to People & Culture for investigation. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p><strong>Support</strong> The company provides reasonable adjustments and support to ensure equal access and opportunities. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    `,
    department: 'People & Culture',
    date: '2024-10-01',
    type: 'Policy',
    category: 'policies',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 16,
    title: 'Vendor Onboarding Checklist',
    tag: 'Procurement',
    description: 'Steps and documentation required to onboard third-party vendors.',
    department: 'Procurement',
    date: '2025-03-14',
    type: 'Template',
    category: 'forms',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];

// Add more mock data as needed for different features
// Mock Home Dashboard Data
export const MOCK_HOME_DATA = {
  dashboard: {
    news: [
      {
        id: 1,
        title: 'AIA receives Best Go Green Initiative Award',
        description: 'We are proud to announce that AIA Engineering has been honored with the Best Go Green Initiative Award at the Net Zero Summit and Awards. This award is a recognition of our commitment towards sustainable practices and environmental responsibility.',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
        date: '2025-03-11',
        category: 'Important',
      },
      {
        id: 2,
        title: 'Company Achieves Record Q4 Results',
        description: 'We are thrilled to announce that our company has achieved record-breaking results in Q4 2025, exceeding all expectations.',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
        date: '2026-02-08',
        category: 'Company News',
      },
      {
        id: 3,
        title: 'New Product Launch: Innovation 2026',
        description: 'Introducing our latest innovation that will revolutionize the industry. Join us for the virtual launch event.',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
        date: '2026-02-09',
        category: 'Product',
      },
      {
        id: 4,
        title: 'Team Building Event This Weekend',
        description: 'Join us for an exciting team building retreat. Activities include workshops, outdoor games, and networking.',
        image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
        date: '2026-02-10',
        category: 'Events',
      },
    ],
    quickLinks: [
      { id: 1, name: 'Apply Leave', icon: '📅', link: '/leave/apply' },
      { id: 2, name: 'View Payslip', icon: '💰', link: '/payroll/payslip' },
      { id: 3, name: 'Submit Timesheet', icon: '⏰', link: '/timesheet' },
      { id: 4, name: 'IT Support', icon: '💻', link: '/support/it' },
      { id: 5, name: 'Employee Directory', icon: '👥', link: '/people' },
      { id: 6, name: 'Policies', icon: '📋', link: '/policies' },
    ],
    events: [
      {
        id: 1,
        title: 'All Hands Meeting',
        date: '2026-02-15',
        time: '10:00 AM',
        location: 'Conference Hall A',
        attendees: 45,
      },
      {
        id: 2,
        title: 'Tech Talk: AI & ML',
        date: '2026-02-18',
        time: '2:00 PM',
        location: 'Virtual',
        attendees: 120,
      },
      {
        id: 3,
        title: 'Town Hall Q&A',
        date: '2026-02-22',
        time: '11:00 AM',
        location: 'Main Auditorium',
        attendees: 200,
      },
      {
        id: 4,
        title: 'Wellness Workshop',
        date: '2026-02-25',
        time: '4:00 PM',
        location: 'Online',
        attendees: 80,
      },
    ],
    newJoinees: [
      { id: 1, name: 'Sarah Johnson', position: 'Senior Developer', department: 'Engineering', company: 'AIA', empCode: 'AIA1024', joinDate: '2026-02-01', dateOfBirth: '1992-03-15', location: 'Mumbai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', phone: '+1 555-0101', email: 'sarah.j@company.com', welcomeNote: 'Welcome to the team, Sarah! We are thrilled to have your engineering expertise on board. Feel free to reach out to your buddy or HR if you need anything during your first few weeks.' },
      { id: 2, name: 'Michael Chen', position: 'Product Manager', department: 'Product', company: 'Vega', empId: 'VEGA458', joinDate: '2026-02-03', dateOfBirth: '1988-07-22', location: 'Bangalore', businessVertical: 'Technology', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', phone: '+1 555-0102', email: 'michael.c@company.com', welcomeNote: 'A warm welcome to Michael! Your product leadership will be a great addition. We look forward to collaborating with you.' },
      { id: 3, name: 'Emily Davis', position: 'UX Designer', department: 'Design', joinDate: '2026-02-05', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', phone: '+1 555-0103', email: 'emily.d@company.com' },
      { id: 4, name: 'Rahul Mehta', position: 'Business Analyst', department: 'Strategy', joinDate: '2026-02-07', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul', phone: '+1 555-0104', email: 'rahul.m@company.com' },
      { id: 5, name: 'Jessica Wong', position: 'Data Engineer', department: 'Engineering', joinDate: '2026-02-08', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica', phone: '+1 555-0105', email: 'jessica.w@company.com' },
      { id: 6, name: 'James Wilson', position: 'Marketing Specialist', department: 'Marketing', joinDate: '2026-02-09', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', phone: '+1 555-0106', email: 'james.w@company.com' },
      { id: 7, name: 'Maria Garcia', position: 'HR Coordinator', department: 'Human Resources', joinDate: '2026-02-10', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', phone: '+1 555-0107', email: 'maria.g@company.com' },
      { id: 8, name: 'Daniel Kim', position: 'Frontend Developer', department: 'Engineering', joinDate: '2026-02-11', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel', phone: '+1 555-0108', email: 'daniel.k@company.com' },
      { id: 9, name: 'Sophie Turner', position: 'Content Writer', department: 'Marketing', joinDate: '2026-02-12', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie', phone: '+1 555-0109', email: 'sophie.t@company.com' },
      { id: 10, name: "Kevin O'Brien", position: 'DevOps Engineer', department: 'Engineering', joinDate: '2026-02-13', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin', phone: '+1 555-0110', email: 'kevin.o@company.com' },
      { id: 11, name: 'Amanda Foster', position: 'Finance Analyst', department: 'Finance', joinDate: '2026-02-14', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda', phone: '+1 555-0111', email: 'amanda.f@company.com' },
      { id: 12, name: 'Chris Lee', position: 'QA Engineer', department: 'Quality Assurance', joinDate: '2026-02-15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris', phone: '+1 555-0112', email: 'chris.l@company.com' },
    ],
    courses: [
      {
        id: 1,
        title: 'Advanced JavaScript Patterns',
        instructor: 'John Smith',
        progress: 65,
        totalLessons: 24,
        completedLessons: 15,
        thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
        deadline: '2026-03-15',
      },
      {
        id: 2,
        title: 'Leadership & Management',
        instructor: 'Dr. Jane Wilson',
        progress: 40,
        totalLessons: 18,
        completedLessons: 7,
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
        deadline: '2026-03-20',
      },
      {
        id: 3,
        title: 'Data Analytics Fundamentals',
        instructor: 'Robert Taylor',
        progress: 85,
        totalLessons: 20,
        completedLessons: 17,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        deadline: '2026-02-28',
      },
      {
        id: 4,
        title: 'Cloud Architecture & AWS',
        instructor: 'Amy Foster',
        progress: 20,
        totalLessons: 30,
        completedLessons: 6,
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
        deadline: '2026-04-10',
      },
      {
        id: 5,
        title: 'Agile & Scrum Master',
        instructor: 'Mark Stevens',
        progress: 55,
        totalLessons: 12,
        completedLessons: 7,
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
        deadline: '2026-03-25',
      },
      {
        id: 6,
        title: 'React & Next.js Advanced',
        instructor: 'Sarah Johnson',
        progress: 90,
        totalLessons: 15,
        completedLessons: 14,
        thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
        deadline: '2026-03-01',
      },
      {
        id: 7,
        title: 'Cybersecurity Essentials',
        instructor: 'David Park',
        progress: 35,
        totalLessons: 22,
        completedLessons: 8,
        thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
        deadline: '2026-04-05',
      },
      {
        id: 8,
        title: 'Communication Skills',
        instructor: 'Lisa Chen',
        progress: 70,
        totalLessons: 10,
        completedLessons: 7,
        thumbnail: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400',
        deadline: '2026-03-12',
      },
    ],
    birthdays: [
      {
        id: 1,
        name: 'Alex Martinez',
        position: 'HR Manager',
        department: 'Human Resources',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        date: '2026-02-10',
      },
      {
        id: 2,
        name: 'Lisa Anderson',
        position: 'Marketing Lead',
        department: 'Marketing',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
        date: '2026-02-10',
      },
      {
        id: 3,
        name: 'Sanjay Patel',
        position: 'Operations Manager',
        department: 'Operations',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay',
        date: '2026-02-10',
      },
      {
        id: 4,
        name: 'Priya Sharma',
        position: 'QA Engineer',
        department: 'Quality Assurance',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
        date: '2026-02-10',
      },
    ],
    anniversaries: [
      {
        id: 1,
        name: 'David Brown',
        position: 'Senior Engineer',
        department: 'Engineering',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        yearsCompleted: 5,
        joinDate: '2021-02-10',
      },
      {
        id: 2,
        name: 'Rachel Green',
        position: 'Finance Director',
        department: 'Finance',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel',
        yearsCompleted: 3,
        joinDate: '2023-02-10',
      },
      {
        id: 3,
        name: 'Anita Desai',
        position: 'HR Business Partner',
        department: 'Human Resources',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anita',
        yearsCompleted: 2,
        joinDate: '2024-02-10',
      },
    ],
  },
  news: [],
  quickLinks: [],
  events: [],
  newJoinees: [],
  courses: [],
  birthdays: [],
  anniversaries: [],
};

// Mock Course Categories (Courses page)
export const MOCK_COURSE_CATEGORIES = [
  {
    id: 1,
    title: 'Mandatory Training',
    description:
      'Essential compliance and safety training required for all employees. Complete this to ensure workplace standards.',
    modules: 5,
    hours: 21,
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&fit=crop&q=80&auto=format',
    href: '/courses',
  },
  {
    id: 2,
    title: 'Orientation',
    description:
      'Start here to learn company culture, policies, and tools. A guided path for new joiners.',
    modules: 5,
    hours: 16,
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&fit=crop&q=80&auto=format',
    href: '/courses',
  },
  {
    id: 3,
    title: 'Courses',
    description:
      'Explore skill-based courses to grow expertise across roles. Learn at your own pace.',
    modules: 5,
    hours: 9,
    image:
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1600&fit=crop&q=80&auto=format',
    href: '/courses',
  },
];
// Mock News Data (Extended)
export const MOCK_NEWS_DATA = [
  {
    id: 1,
    title: 'AIA receives Best Go Green Initiative Award',
    description: 'We are proud to announce that AIA Engineering has been honored with the Best Go Green Initiative Award at the Net Zero Summit and Awards. This award is a recognition of our commitment towards sustainable practices and environmental responsibility.',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
    date: '2026-03-11',
    category: 'Important',
  },
  {
    id: 2,
    title: 'Company Achieves Record Q4 Results',
    description: 'We are thrilled to announce that our company has achieved record-breaking results in Q4 2025, exceeding all expectations and setting new benchmarks for growth.',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
    date: '2026-02-08',
    category: 'Company News',
  },
  {
    id: 3,
    title: 'New Product Launch: Innovation 2026',
    description: 'Introducing our latest innovation that will revolutionize the industry. Join us for the virtual launch event on March 15th.',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    date: '2026-02-09',
    category: 'Product',
  },
  {
    id: 4,
    title: 'Team Building Event This Weekend',
    description: 'Join us for an exciting team building retreat. Activities include workshops, outdoor games, and networking opportunities.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
    date: '2026-02-10',
    category: 'Events',
  },
  {
    id: 5,
    title: 'Annual Town Hall Meeting Announced',
    description: 'CEO will address all employees in the upcoming town hall meeting. Topics include company vision, strategic goals, and Q&A session.',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    date: '2026-02-12',
    category: 'Announcements',
  },
  {
    id: 6,
    title: 'Employee Wellness Program Launch',
    description: 'New comprehensive wellness program offers fitness classes, mental health support, and nutrition counseling for all employees.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    date: '2026-02-14',
    category: 'Company News',
  },
  {
    id: 7,
    title: 'Innovation Lab Opens New Facility',
    description: 'State-of-the-art research facility dedicated to developing cutting-edge solutions and fostering innovation.',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
    date: '2026-02-16',
    category: 'Product',
  },
  {
    id: 8,
    title: 'Sustainability Report 2025 Released',
    description: 'Our annual sustainability report highlights achievements in reducing carbon footprint and implementing green initiatives.',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    date: '2026-02-18',
    category: 'Important',
  },
  {
    id: 9,
    title: 'Global Expansion: New Office in Singapore',
    description: 'Expanding our presence in Asia Pacific with a new regional headquarters in Singapore, creating 200+ jobs.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    date: '2026-02-20',
    category: 'Company News',
  },
  {
    id: 10,
    title: 'Tech Conference 2026 Registration Open',
    description: 'Annual technology conference featuring industry leaders, workshops, and networking opportunities. Early bird registration now available.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    date: '2026-02-22',
    category: 'Events',
  },
];

// Calendar feature: events and holidays (categories match legend)
export const CALENDAR_EVENT_CATEGORIES = {
  conferences: { label: 'Conferences', color: '#2563EB' },
  birthdays: { label: 'Birthdays', color: '#FD8C02' },
  work_anniversaries: { label: 'Work Anniversaries', color: '#9C2EDB' },
  training: { label: 'Training Sessions', color: '#00F078' },
  loreum: { label: 'Loreum ipsum', color: '#F0C51A' },
  loreum_blue: { label: 'Loreum ipsum', color: '#2563EB' },
  holidays: { label: 'Holidays', color: '#EF4444' },
};

export const MOCK_CALENDAR_EVENTS = [
  { id: 1, title: 'Sarah Johnson...', date: '2024-01-19', category: 'birthdays', color: '#FD8C02', fullTitle: 'Sarah Johnson', description: '', time: '', location: '', icon: 'gift' },
  { id: 2, title: 'Tech Talk, Al...', date: '2024-01-20', category: 'conferences', color: '#2563EB', fullTitle: 'Tech Talk: AI in 2024', description: 'A concise overview of how AI is evolving in 2024, covering key trends, real-world applications, and what they mean for businesses and professionals. The session highlights practical use cases, emerging technologies, and how organizations can prepare for what\'s next in AI.', time: '2:00 PM', location: 'Main Auditorium', icon: 'calendar' },
  { id: 3, title: 'Michael Chen...', date: '2024-01-20', category: 'work_anniversaries', color: '#9C2EDB', fullTitle: 'Michael Chen - 5 Years', description: '', time: '', location: '', icon: 'gift' },
  { id: 4, title: 'Leadership Wo...', date: '2024-01-20', category: 'training', color: '#00F078', fullTitle: 'Leadership Workshop', description: 'Develop essential leadership skills to effectively guide teams, make informed decisions, and drive organizational success.', time: '2:00 PM', location: 'Gandhinagar', icon: 'graduation-cap' },
  { id: 5, title: 'Quarterly All...', date: '2024-01-22', category: 'conferences', color: '#2563EB', fullTitle: 'Quarterly All Hands', description: '', time: '', location: '', icon: 'calendar' },
  { id: 6, title: 'Emily Rodrig...', date: '2024-01-22', category: 'birthdays', color: '#FD8C02', fullTitle: 'Emily Rodriguez', description: '', time: '', location: '', icon: 'gift' },
  { id: 7, title: 'Loreum ipsum', date: '2024-01-25', category: 'loreum_blue', color: '#2563EB', fullTitle: 'Loreum ipsum', description: '', time: '', location: '', icon: 'calendar' },
  { id: 8, title: 'Product Launc...', date: '2024-01-25', category: 'conferences', color: '#1d4ed8', fullTitle: 'Product Launch', description: '', time: '', location: '', icon: 'calendar' },
  { id: 9, title: 'Republic Day', date: '2024-01-26', category: 'holidays', color: '#EF4444', fullTitle: 'Republic Day', description: '', time: '', location: '', icon: 'calendar' },
  { id: 10, title: 'Leadership Wo...', date: '2024-01-28', category: 'training', color: '#00F078', fullTitle: 'Leadership Workshop', description: '', time: '', location: '', icon: 'graduation-cap' },
  { id: 11, title: 'Loreum ipsum', date: '2024-01-30', category: 'loreum_blue', color: '#2563EB', fullTitle: 'Loreum ipsum', description: '', time: '', location: '', icon: 'calendar' },
];

export const MOCK_CALENDAR_HOLIDAYS = [
  { id: 1, title: 'Republic Day', date: '2024-01-26' },
];