export interface GuidanceSurfaceContract {
  id: string;
  path: string;
  requiredPatterns: RegExp[];
}

function rx(pattern: string): RegExp {
  return new RegExp(pattern, 'i');
}

const ROOT_TEMPLATE_PATTERNS = [
  rx('quality-first|intent-deepening'),
  rx('clear, low-risk, reversible next steps'),
  rx('ordinary safe reversible work|safe reversible work should proceed without reconfirmation|safe reversible work is already authorized'),
  rx('local overrides?.*non-conflicting instructions'),
  rx('Outside active `team`/`swarm` mode, use `executor`'),
  rx('Reserve `worker` strictly for active `team`/`swarm` sessions'),
  rx('do not skip prerequisites|task is grounded and verified'),
  rx('concise evidence summaries|verification evidence collected|explicit blocker'),
];

const CORE_ROLE_PATTERNS = {
  executor: [
    rx('quality-first|intent-deepening'),
    rx('clear, low-risk, reversible next steps'),
    rx('local overrides?.*non-conflicting constraints'),
    rx('task is grounded and verified'),
    rx('No evidence = not complete|evidence-backed completion details|explicit blocker'),
  ],
  planner: [
    rx('quality-first|intent-deepening|information-dense plan summaries'),
    rx('local overrides?.*non-conflicting constraints'),
    rx('plan is grounded in evidence'),
    rx('clear, low-risk planning steps|materially branching decisions'),
  ],
  verifier: [
    rx('quality-first, evidence-dense summaries'),
    rx('verdict is grounded'),
    rx('non-conflicting acceptance criteria'),
    rx('keep gathering the required evidence|additional tests, diagnostics, or inspection'),
  ],
};

const WAVE_TWO_PATTERNS = [
  rx('Default final-output shape: .*evidence-dense'),
  rx('Treat newer user task updates as local overrides'),
  rx('safe reversible work as already authorized'),
  rx('Evidence or an explicit blocker is required before stopping'),
  rx('user says `continue`'),
  rx('keep using those tools until .* grounded|Continue through clear, low-risk'),
];

const CATALOG_PATTERNS = [
  rx('Default final-output shape: .*evidence-dense'),
  rx('Treat newer user task updates as local overrides'),
  rx('safe reversible work as already authorized'),
  rx('Evidence or an explicit blocker is required before stopping'),
  rx('user says `continue`'),
  rx('keep using those tools until .* grounded|Continue through clear, low-risk'),
];

const SKILL_PATTERNS = [
  rx('quality-first, evidence-dense progress and completion reporting'),
  rx('local overrides for the active workflow branch'),
  rx('safe reversible work as already authorized'),
  rx('Evidence or an explicit blocker is required before stopping'),
  rx('user says `continue`'),
  rx('Continue through clear, low-risk, reversible next steps automatically'),
  rx('keep using the relevant tools until the workflow is grounded|keep using the relevant tools until the execution loop is grounded|keep using the relevant tools until the team workflow is grounded|keep using the relevant tools until the QA cycle is grounded|keep using the relevant tools until the plan is grounded|keep using the relevant tools until the consensus-planning flow is grounded'),
];

export const ROOT_TEMPLATE_CONTRACTS: GuidanceSurfaceContract[] = [
  { id: 'agents-root', path: 'AGENTS.md', requiredPatterns: ROOT_TEMPLATE_PATTERNS },
  { id: 'agents-template', path: 'templates/AGENTS.md', requiredPatterns: ROOT_TEMPLATE_PATTERNS },
];

export const CORE_ROLE_CONTRACTS: GuidanceSurfaceContract[] = [
  { id: 'executor', path: 'prompts/executor.md', requiredPatterns: CORE_ROLE_PATTERNS.executor },
  { id: 'planner', path: 'prompts/planner.md', requiredPatterns: CORE_ROLE_PATTERNS.planner },
  { id: 'verifier', path: 'prompts/verifier.md', requiredPatterns: CORE_ROLE_PATTERNS.verifier },
];

export const SCENARIO_ROLE_CONTRACTS: GuidanceSurfaceContract[] = [
  {
    id: 'executor-scenarios',
    path: 'prompts/executor.md',
    requiredPatterns: [
      rx('user says `continue`'),
      rx('make a PR targeting dev'),
      rx('merge to dev if CI green'),
      rx('confirm CI is green, then merge'),
    ],
  },
  {
    id: 'planner-scenarios',
    path: 'prompts/planner.md',
    requiredPatterns: [
      rx('user says `continue`'),
      rx('user says `make a PR`'),
      rx('user says `merge if CI green`'),
      rx('scoped condition on the next operational step'),
    ],
  },
  {
    id: 'verifier-scenarios',
    path: 'prompts/verifier.md',
    requiredPatterns: [
      rx('user says `merge if CI green`'),
      rx('confirm they are green'),
      rx('user says `continue`'),
      rx('keep gathering the required evidence'),
    ],
  },
];

export const WAVE_TWO_CONTRACTS: GuidanceSurfaceContract[] = [
  'architect',
  'critic',
  'debugger',
  'test-engineer',
  'code-reviewer',
  'quality-reviewer',
  'security-reviewer',
  'researcher',
  'explore',
].map((name) => ({
  id: name,
  path: `prompts/${name}.md`,
  requiredPatterns: WAVE_TWO_PATTERNS,
}));

export const CATALOG_CONTRACTS: GuidanceSurfaceContract[] = [
  'analyst',
  'api-reviewer',
  'build-fixer',
  'dependency-expert',
  'designer',
  'git-master',
  'information-architect',
  'performance-reviewer',
  'product-analyst',
  'product-manager',
  'qa-tester',
  'quality-strategist',
  'style-reviewer',
  'ux-researcher',
  'vision',
  'writer',
].map((name) => ({
  id: name,
  path: `prompts/${name}.md`,
  requiredPatterns: CATALOG_PATTERNS,
}));

export const LEGACY_PROMPT_CONTRACTS: GuidanceSurfaceContract[] = [
  {
    id: 'code-simplifier',
    path: 'prompts/code-simplifier.md',
    requiredPatterns: [
      rx('local overrides for the active simplification scope'),
      rx('simplification result is grounded'),
      rx('safe reversible work as already authorized'),
      rx('Evidence or an explicit blocker is required before stopping'),
      rx('<Scenario_Examples>'),
    ],
  },
];

export const SPECIALIZED_PROMPT_CONTRACTS: GuidanceSurfaceContract[] = [
  {
    id: 'sisyphus-lite',
    path: 'prompts/sisyphus-lite.md',
    requiredPatterns: [
      rx('quality-first, intent-deepening outputs'),
      rx('Treat newer user instructions as local overrides'),
      rx('No evidence = not complete'),
      rx('Evidence or an explicit blocker is required before stopping'),
      rx('specialized worker behavior prompt|worker behavior prompt'),
    ],
  },
];

export const SKILL_CONTRACTS: GuidanceSurfaceContract[] = [
  'analyze',
  'autopilot',
  'build-fix',
  'code-review',
  'plan',
  'ralph',
  'ralplan',
  'security-review',
  'team',
  'ultraqa',
].map((name) => ({
  id: name,
  path: `skills/${name}/SKILL.md`,
  requiredPatterns: SKILL_PATTERNS,
}));
