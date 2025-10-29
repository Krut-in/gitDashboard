/**
 * Language Detection Utility
 * 
 * Detects programming languages from file extensions in analyzed repositories.
 * Uses GitHub's official language colors for consistency.
 */

// Language configuration matching GitHub's linguist
export const LANGUAGE_CONFIG: Record<string, { name: string; color: string; extensions: string[] }> = {
  typescript: {
    name: 'TypeScript',
    color: '#3178c6',
    extensions: ['.ts', '.tsx', '.mts', '.cts']
  },
  javascript: {
    name: 'JavaScript',
    color: '#f1e05a',
    extensions: ['.js', '.jsx', '.mjs', '.cjs']
  },
  python: {
    name: 'Python',
    color: '#3572A5',
    extensions: ['.py', '.pyw', '.pyi']
  },
  css: {
    name: 'CSS',
    color: '#563d7c',
    extensions: ['.css', '.scss', '.sass', '.less']
  },
  html: {
    name: 'HTML',
    color: '#e34c26',
    extensions: ['.html', '.htm']
  },
  json: {
    name: 'JSON',
    color: '#292929',
    extensions: ['.json']
  },
  markdown: {
    name: 'Markdown',
    color: '#083fa1',
    extensions: ['.md', '.markdown']
  },
  yaml: {
    name: 'YAML',
    color: '#cb171e',
    extensions: ['.yml', '.yaml']
  },
  shell: {
    name: 'Shell',
    color: '#89e051',
    extensions: ['.sh', '.bash', '.zsh']
  },
  java: {
    name: 'Java',
    color: '#b07219',
    extensions: ['.java']
  },
  go: {
    name: 'Go',
    color: '#00ADD8',
    extensions: ['.go']
  },
  rust: {
    name: 'Rust',
    color: '#dea584',
    extensions: ['.rs']
  },
  c: {
    name: 'C',
    color: '#555555',
    extensions: ['.c', '.h']
  },
  cpp: {
    name: 'C++',
    color: '#f34b7d',
    extensions: ['.cpp', '.hpp', '.cc', '.cxx', '.hh']
  },
  csharp: {
    name: 'C#',
    color: '#178600',
    extensions: ['.cs']
  },
  php: {
    name: 'PHP',
    color: '#4F5D95',
    extensions: ['.php']
  },
  ruby: {
    name: 'Ruby',
    color: '#701516',
    extensions: ['.rb']
  },
  swift: {
    name: 'Swift',
    color: '#ffac45',
    extensions: ['.swift']
  },
  kotlin: {
    name: 'Kotlin',
    color: '#A97BFF',
    extensions: ['.kt', '.kts']
  },
  scala: {
    name: 'Scala',
    color: '#c22d40',
    extensions: ['.scala']
  },
  sql: {
    name: 'SQL',
    color: '#e38c00',
    extensions: ['.sql']
  },
  xml: {
    name: 'XML',
    color: '#0060ac',
    extensions: ['.xml']
  },
  vue: {
    name: 'Vue',
    color: '#41b883',
    extensions: ['.vue']
  },
  svelte: {
    name: 'Svelte',
    color: '#ff3e00',
    extensions: ['.svelte']
  },
  dart: {
    name: 'Dart',
    color: '#00B4AB',
    extensions: ['.dart']
  },
  r: {
    name: 'R',
    color: '#198CE7',
    extensions: ['.r', '.R']
  },
  lua: {
    name: 'Lua',
    color: '#000080',
    extensions: ['.lua']
  },
  perl: {
    name: 'Perl',
    color: '#0298c3',
    extensions: ['.pl', '.pm']
  },
  elixir: {
    name: 'Elixir',
    color: '#6e4a7e',
    extensions: ['.ex', '.exs']
  },
  clojure: {
    name: 'Clojure',
    color: '#db5855',
    extensions: ['.clj', '.cljs', '.cljc']
  },
  haskell: {
    name: 'Haskell',
    color: '#5e5086',
    extensions: ['.hs', '.lhs']
  },
  dockerfile: {
    name: 'Dockerfile',
    color: '#384d54',
    extensions: ['.dockerfile']
  }
};

/**
 * Get language from file extension
 */
export function getLanguageFromFilename(filename: string): { language: string; color: string } | null {
  const lowerFilename = filename.toLowerCase();
  
  // Special cases
  if (lowerFilename === 'dockerfile' || lowerFilename.includes('dockerfile')) {
    return { language: LANGUAGE_CONFIG.dockerfile.name, color: LANGUAGE_CONFIG.dockerfile.color };
  }
  
  // Extract extension
  const parts = filename.split('.');
  if (parts.length < 2) {
    return null; // No extension
  }
  
  const ext = '.' + parts[parts.length - 1].toLowerCase();
  
  // Find matching language
  for (const config of Object.values(LANGUAGE_CONFIG)) {
    if (config.extensions.includes(ext)) {
      return { language: config.name, color: config.color };
    }
  }
  
  return null;
}

/**
 * Analyze language distribution from file list
 */
export function analyzeLanguageDistribution(
  files: string[]
): { language: string; fileCount: number; percentage: number; color: string }[] {
  const languageCounts = new Map<string, { count: number; color: string }>();
  let totalFiles = 0;
  
  // Count files by language
  for (const file of files) {
    const result = getLanguageFromFilename(file);
    if (result) {
      totalFiles++;
      const current = languageCounts.get(result.language) || { count: 0, color: result.color };
      current.count++;
      languageCounts.set(result.language, current);
    }
  }
  
  // Convert to array with percentages
  const breakdown: { language: string; fileCount: number; percentage: number; color: string }[] = [];
  
  languageCounts.forEach((data, language) => {
    breakdown.push({
      language,
      fileCount: data.count,
      percentage: totalFiles > 0 ? (data.count / totalFiles) * 100 : 0,
      color: data.color
    });
  });
  
  // Sort by count (descending)
  breakdown.sort((a, b) => b.fileCount - a.fileCount);
  
  return breakdown;
}
