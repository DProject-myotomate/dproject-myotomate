export interface SkillItem {
  name: string;
  category: string;
  popular?: boolean;
}

export const POPULAR_SKILLS: SkillItem[] = [
  // Frontend
  { name: 'React', category: 'Frontend', popular: true },
  { name: 'TypeScript', category: 'Frontend', popular: true },
  { name: 'Next.js', category: 'Frontend', popular: true },
  { name: 'Tailwind CSS', category: 'Frontend', popular: true },
  { name: 'JavaScript', category: 'Frontend', popular: true },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Nuxt.js', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Svelte', category: 'Frontend' },
  { name: 'Redux / Zustand', category: 'Frontend' },
  { name: 'HTML5 & CSS3', category: 'Frontend' },
  { name: 'Web Performance', category: 'Frontend' },
  { name: 'Vite', category: 'Frontend' },
  { name: 'Webpack', category: 'Frontend' },
  { name: 'Responsive Design', category: 'Frontend' },
  { name: 'Micro-frontends', category: 'Frontend' },
  { name: 'GraphQL', category: 'Frontend / API' },

  // Backend & APIs
  { name: 'Node.js', category: 'Backend', popular: true },
  { name: 'Express.js', category: 'Backend' },
  { name: 'NestJS', category: 'Backend' },
  { name: 'Golang', category: 'Backend', popular: true },
  { name: 'Python', category: 'Backend / Data', popular: true },
  { name: 'Django', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Java', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: 'PHP', category: 'Backend' },
  { name: 'Laravel', category: 'Backend', popular: true },
  { name: 'C# / .NET', category: 'Backend' },
  { name: 'REST API', category: 'Backend', popular: true },
  { name: 'gRPC', category: 'Backend' },
  { name: 'Microservices', category: 'Backend' },
  { name: 'System Design', category: 'Backend' },
  { name: 'Kafka', category: 'Backend / Message Queue' },
  { name: 'RabbitMQ', category: 'Backend / Message Queue' },

  // Databases & Storage
  { name: 'PostgreSQL', category: 'Database', popular: true },
  { name: 'MySQL', category: 'Database', popular: true },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Redis', category: 'Database / Cache', popular: true },
  { name: 'Elasticsearch', category: 'Database / Search' },
  { name: 'SQLite', category: 'Database' },
  { name: 'Prisma ORM', category: 'Database' },
  { name: 'Drizzle ORM', category: 'Database' },
  { name: 'Firebase Firestore', category: 'Database' },
  { name: 'Supabase', category: 'Database' },

  // DevOps & Cloud
  { name: 'Docker', category: 'DevOps & Cloud', popular: true },
  { name: 'Kubernetes', category: 'DevOps & Cloud', popular: true },
  { name: 'AWS (Amazon Web Services)', category: 'DevOps & Cloud', popular: true },
  { name: 'Google Cloud Platform (GCP)', category: 'DevOps & Cloud' },
  { name: 'Microsoft Azure', category: 'DevOps & Cloud' },
  { name: 'CI/CD & GitHub Actions', category: 'DevOps & Cloud' },
  { name: 'Terraform', category: 'DevOps & Cloud' },
  { name: 'Linux System Administration', category: 'DevOps & Cloud' },
  { name: 'Nginx', category: 'DevOps & Cloud' },
  { name: 'Cybersecurity & OWASP', category: 'DevOps & Cloud' },

  // Mobile
  { name: 'React Native', category: 'Mobile App', popular: true },
  { name: 'Flutter', category: 'Mobile App', popular: true },
  { name: 'Kotlin (Android)', category: 'Mobile App' },
  { name: 'Swift (iOS)', category: 'Mobile App' },
  { name: 'Mobile App Development', category: 'Mobile App' },

  // UI/UX & Design
  { name: 'Figma', category: 'UI/UX & Desain', popular: true },
  { name: 'UI/UX Design', category: 'UI/UX & Desain', popular: true },
  { name: 'Design Systems', category: 'UI/UX & Desain' },
  { name: 'Prototyping', category: 'UI/UX & Desain' },
  { name: 'User Research', category: 'UI/UX & Desain' },
  { name: 'Wireframing', category: 'UI/UX & Desain' },
  { name: 'Adobe Photoshop', category: 'UI/UX & Desain' },
  { name: 'Adobe Illustrator', category: 'UI/UX & Desain' },
  { name: 'Canva', category: 'UI/UX & Desain' },

  // Data & AI
  { name: 'SQL', category: 'Data & AI', popular: true },
  { name: 'Data Analysis', category: 'Data & AI', popular: true },
  { name: 'Data Science', category: 'Data & AI' },
  { name: 'Power BI', category: 'Data & AI', popular: true },
  { name: 'Tableau', category: 'Data & AI' },
  { name: 'Machine Learning', category: 'Data & AI' },
  { name: 'Deep Learning', category: 'Data & AI' },
  { name: 'TensorFlow / PyTorch', category: 'Data & AI' },
  { name: 'Generative AI & LLMs', category: 'Data & AI' },
  { name: 'Prompt Engineering', category: 'Data & AI' },
  { name: 'Pandas & NumPy', category: 'Data & AI' },
  { name: 'Statistical Analysis', category: 'Data & AI' },
  { name: 'Business Intelligence (BI)', category: 'Data & AI' },

  // Product & Project Management
  { name: 'Product Management', category: 'Product & Manajemen', popular: true },
  { name: 'Agile / Scrum', category: 'Product & Manajemen', popular: true },
  { name: 'Jira & Confluence', category: 'Product & Manajemen' },
  { name: 'Product Roadmap', category: 'Product & Manajemen' },
  { name: 'A/B Testing & Experimentation', category: 'Product & Manajemen' },
  { name: 'Scrum Master', category: 'Product & Manajemen' },
  { name: 'Kanban', category: 'Product & Manajemen' },
  { name: 'Sprint Planning', category: 'Product & Manajemen' },
  { name: 'OKRs & KPIs', category: 'Product & Manajemen' },

  // Marketing & Growth
  { name: 'SEO (Search Engine Optimization)', category: 'Marketing & Pertumbuhan', popular: true },
  { name: 'Google Ads & SEM', category: 'Marketing & Pertumbuhan', popular: true },
  { name: 'Meta Ads (Facebook & IG)', category: 'Marketing & Pertumbuhan', popular: true },
  { name: 'Performance Marketing', category: 'Marketing & Pertumbuhan' },
  { name: 'Copywriting', category: 'Marketing & Pertumbuhan', popular: true },
  { name: 'Content Strategy & Creation', category: 'Marketing & Pertumbuhan' },
  { name: 'Social Media Management', category: 'Marketing & Pertumbuhan' },
  { name: 'TikTok Strategy & Reels', category: 'Marketing & Pertumbuhan' },
  { name: 'Growth Hacking', category: 'Marketing & Pertumbuhan' },
  { name: 'Google Analytics 4 (GA4)', category: 'Marketing & Pertumbuhan' },
  { name: 'Email Marketing (Mailchimp/Klaviyo)', category: 'Marketing & Pertumbuhan' },

  // Finance & Accounting
  { name: 'Accounting & Pembukuan', category: 'Keuangan & Akuntansi', popular: true },
  { name: 'Financial Analysis', category: 'Keuangan & Akuntansi' },
  { name: 'Taxation (PPh 21, PPh 23, PPN)', category: 'Keuangan & Akuntansi' },
  { name: 'Microsoft Excel (Advanced & VLOOKUP)', category: 'Keuangan & Administrasi', popular: true },
  { name: 'SAP ERP', category: 'Keuangan & Bisnis' },
  { name: 'Financial Modeling', category: 'Keuangan & Bisnis' },
  { name: 'Budgeting & Cashflow Management', category: 'Keuangan & Bisnis' },

  // Testing & QA
  { name: 'QA Manual Testing', category: 'Quality Assurance' },
  { name: 'Automation Testing', category: 'Quality Assurance' },
  { name: 'Cypress', category: 'Quality Assurance' },
  { name: 'Playwright', category: 'Quality Assurance' },
  { name: 'Jest / Vitest', category: 'Quality Assurance' },

  // Soft Skills & Languages
  { name: 'English Fluency (Proficient)', category: 'Bahasa & Komunikasi', popular: true },
  { name: 'Leadership & Team Management', category: 'Soft Skills' },
  { name: 'Problem Solving', category: 'Soft Skills' },
  { name: 'Cross-functional Collaboration', category: 'Soft Skills' },
  { name: 'Public Speaking & Presentation', category: 'Soft Skills' },
  { name: 'Negotiation Skills', category: 'Soft Skills' },
];

/**
 * Filter recommendations based on user query and currently selected skills
 */
export function getSkillRecommendations(
  query: string,
  currentSkills: string[],
  limit = 8
): SkillItem[] {
  const trimmed = query.trim().toLowerCase();
  const lowerExisting = new Set(currentSkills.map((s) => s.toLowerCase()));

  // Available skills not yet picked
  const candidates = POPULAR_SKILLS.filter(
    (item) => !lowerExisting.has(item.name.toLowerCase())
  );

  if (!trimmed) {
    // Return top popular items when input is empty/focused
    return candidates.filter((item) => item.popular).slice(0, limit);
  }

  // Priority 1: Starts with query
  const startsWith = candidates.filter((item) =>
    item.name.toLowerCase().startsWith(trimmed)
  );

  // Priority 2: Contains query but does not start with query
  const contains = candidates.filter(
    (item) =>
      !item.name.toLowerCase().startsWith(trimmed) &&
      (item.name.toLowerCase().includes(trimmed) ||
        item.category.toLowerCase().includes(trimmed))
  );

  return [...startsWith, ...contains].slice(0, limit);
}
