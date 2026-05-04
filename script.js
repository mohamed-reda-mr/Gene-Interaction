'use strict';
const MODELS = {
  mendelian: {
    name: 'Mendelian',
    expectedRatio: '9 : 3 : 3 : 1',
    description: 'Classic Mendelian inheritance with two independent loci. Both genes assort freely, producing the canonical 9:3:3:1 phenotype ratio.',
  },
  complementary: {
    name: 'Complementary',
    expectedRatio: '9 : 7',
    description: 'Both dominant alleles must be present simultaneously for the trait to appear. Either gene absent = no expression.',
  },
  recessive_epistasis: {
    name: 'Recessive Epistasis',
    expectedRatio: '9 : 3 : 4',
    description: 'Homozygous recessive at gene A (aa) masks all expression regardless of gene B. Classic 9:3:4 epistatic ratio.',
  },
  dominant_epistasis: {
    name: 'Dominant Epistasis',
    expectedRatio: '12 : 3 : 1',
    description: 'Gene A dominant allele overrides gene B expression entirely. A__ phenotype collapses the first two Mendelian classes.',
  },
  duplicate: {
    name: 'Duplicate Genes',
    expectedRatio: '15 : 1',
    description: 'Either dominant allele alone is sufficient to produce the phenotype. Only aabb shows the recessive trait.',
  },
  suppression: {
    name: 'Suppression',
    expectedRatio: '13 : 3',
    description: 'Gene B dominant allele suppresses Gene A expression. Only A_bb genotypes express the trait.',
  },
  lethal: {
    name: 'Lethal Alleles',
    expectedRatio: 'Survivors only',
    description: 'Homozygous recessive aa is lethal (organism dies). Survivors show modified ratios based on remaining viable offspring.',
  },
};

const PHENOTYPE_STYLES = {
  Green:  { bg: 'pheno-green',  badge: 'badge-green',  dot: '#00E676', label: 'Green'  },
  Yellow: { bg: 'pheno-yellow', badge: 'badge-yellow', dot: '#FFD600', label: 'Yellow' },
  Blue:   { bg: 'pheno-blue',   badge: 'badge-blue',   dot: '#40C4FF', label: 'Blue'   },
  White:  { bg: 'pheno-white',  badge: 'badge-white',  dot: '#E0E0E0', label: 'White'  },
  Purple: { bg: 'pheno-purple', badge: 'badge-purple', dot: '#CE93D8', label: 'Purple' },
  Red:    { bg: 'pheno-red',    badge: 'badge-red',    dot: '#FF5252', label: 'Red'    },
  Dead:   { bg: 'pheno-black',  badge: 'badge-black',  dot: '#424242', label: 'Dead (aa)' },
};

function parseGenotype(str) {
  str = str.trim().replace(/\s+/g, '');
  const pairs = [];
  const re =/([A-Za-z])([A-Za-z])/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    pairs.push(m[1] + m[2]);
  }
  return pairs;
}
function generateGametes(genePairs) {
  if (!genePairs.length) return [];
  let gametes = [''];
  for (const pair of genePairs) {
    const alleles = pair.split('');
    const newGametes = [];
    for (const g of gametes) {
      for (const a of alleles) {
        newGametes.push(g + a);
      }
    }
    gametes = newGametes;
  }
  return [...new Set(gametes)];
}
function sortAllelePair(a, b) {
  const upperA = a === a.toUpperCase();
  const upperB = b === b.toUpperCase();
  if (upperA && !upperB) return a + b;
  if (!upperA && upperB) return b + a;
  return a + b;
}
function combineGametes(g1, g2) {
  if (g1.length !== g2.length) return '??';
  let result = '';
  for (let i = 0; i < g1.length; i++) {
    result += sortAllelePair(g1[i], g2[i]);
  }
  return result;
}
function doPunnettCross(p1Gametes, p2Gametes) {
  const grid = [];
  for (const g1 of p1Gametes) {
    const row = [];
    for (const g2 of p2Gametes) {
      row.push(combineGametes(g1, g2));
    }
    grid.push(row);
  }
  return grid;
}

function analyzeGenotype(genotype) {
  const pairs = [];
  for (let i = 0; i < genotype.length; i += 2) {
    const pair = genotype.substring(i, i + 2);
    if (pair.length < 2) continue;
    pairs.push(pair);
  }

  const result = {};
  for (const pair of pairs) {
    const locus = pair[0].toUpperCase();
    const a1 = pair[0];
    const a2 = pair[1];
    const isHomoRec = a1 === a1.toLowerCase() && a2 === a2.toLowerCase();
    result[locus] = isHomoRec ? 'homozygous_recessive' : 'dominant';
  }
  return result;
}


function applyMendelian(analysis) {
  const A = analysis['A'];
  const B = analysis['B'];
  const hasA = A === 'dominant';
  const hasB = B === 'dominant';
  if (hasA && hasB)   return 'Green';
  if (hasA && !hasB)  return 'Yellow';
  if (!hasA && hasB)  return 'Blue';
  return 'White';
}


function applyComplementary(analysis) {
  const hasA = analysis['A'] === 'dominant';
  const hasB = analysis['B'] === 'dominant';
  if (hasA && hasB) return 'Green';
  return 'White';
}


function applyRecessiveEpistasis(analysis) {
  const hasA = analysis['A'] === 'dominant';
  const hasB = analysis['B'] === 'dominant';
  if (!hasA) return 'White';
  if (hasA && hasB)  return 'Green';
  if (hasA && !hasB) return 'Yellow';
  return 'White';
}


function applyDominantEpistasis(analysis) {
  const hasA = analysis['A'] === 'dominant';
  const hasB = analysis['B'] === 'dominant';
  if (hasA)           return 'Purple';
  if (!hasA && hasB)  return 'Blue';
  return 'White';
}


function applyDuplicate(analysis) {
  const hasA = analysis['A'] === 'dominant';
  const hasB = analysis['B'] === 'dominant';
  if (hasA || hasB) return 'Red';
  return 'White';
}


function applySuppression(analysis) {
  const hasA = analysis['A'] === 'dominant';
  const hasB = analysis['B'] === 'dominant';
  if (hasB) return 'White';
  if (hasA && !hasB) return 'Green';
  return 'White';
}


function applyLethal(analysis) {
  const isAA_rec = analysis['A'] === 'homozygous_recessive';
  if (isAA_rec) return 'Dead';
  return 'Green';
}

function applyModel(genotype, modelKey) {
  const analysis = analyzeGenotype(genotype);
  switch (modelKey) {
    case 'mendelian':           return applyMendelian(analysis);
    case 'complementary':       return applyComplementary(analysis);
    case 'recessive_epistasis': return applyRecessiveEpistasis(analysis);
    case 'dominant_epistasis':  return applyDominantEpistasis(analysis);
    case 'duplicate':           return applyDuplicate(analysis);
    case 'suppression':         return applySuppression(analysis);
    case 'lethal':              return applyLethal(analysis);
    default:                    return 'White';
  }
}

function countPhenotypes(phenotypes) {
  const counts = {};
  for (const p of phenotypes) {
    counts[p] = (counts[p] || 0) + 1;
  }
  return counts;
}


function buildRatioString(counts) {
  return Object.values(counts).join(' : ');
}

let currentModel = 'mendelian';
let simulationResult = null;


function renderGametes(p1Gametes, p2Gametes) {
  const p1El = document.getElementById('p1-gametes');
  const p2El = document.getElementById('p2-gametes');
  p1El.innerHTML = '';
  p2El.innerHTML = '';

  p1Gametes.forEach((g, i) => {
    const chip = document.createElement('span');
    chip.className = 'gamete-chip p1';
    chip.textContent = g;
    chip.style.animationDelay = `${i * 80}ms`;
    p1El.appendChild(chip);
  });

  p2Gametes.forEach((g, i) => {
    const chip = document.createElement('span');
    chip.className = 'gamete-chip p2';
    chip.textContent = g;
    chip.style.animationDelay = `${i * 80}ms`;
    p2El.appendChild(chip);
  });
}


function renderPunnettSquare(grid, p1Gametes, p2Gametes, modelKey) {
  const table = document.getElementById('punnett-table');
  const thead = table.querySelector('thead tr');
  const tbody = document.getElementById('punnett-body');

  thead.innerHTML = '<th class="corner-cell"></th>';
  tbody.innerHTML = '';

  for (const g of p2Gametes) {
    const th = document.createElement('th');
    th.textContent = g;
    thead.appendChild(th);
  }


  let cellIndex = 0;
  grid.forEach((row, ri) => {
    const tr = document.createElement('tr');


    const rowHeader = document.createElement('th');
    rowHeader.className = 'row-header';
    rowHeader.textContent = p1Gametes[ri];
    tr.appendChild(rowHeader);

    row.forEach((genotype, ci) => {
      const phenotype = applyModel(genotype, modelKey);
      const style = PHENOTYPE_STYLES[phenotype] || PHENOTYPE_STYLES.White;

      const td = document.createElement('td');
      td.className = `punnett-cell ${style.bg}`;
      td.dataset.genotype = genotype;
      td.dataset.phenotype = phenotype;


      td.innerHTML = `
        <span class="cell-genotype">${genotype}</span>
        <span class="cell-phenotype ${style.badge}">${phenotype}</span>
      `;


      const delay = (ri * p2Gametes.length + ci) * 60;
      setTimeout(() => {
        td.classList.add('revealed');
      }, delay);

  
      td.addEventListener('mouseenter', showTooltip);
      td.addEventListener('mouseleave', hideTooltip);
      td.addEventListener('mousemove', moveTooltip);

      tr.appendChild(td);
      cellIndex++;
    });

    tbody.appendChild(tr);
  });
}

const tooltip = (() => {
  const el = document.createElement('div');
  el.className = 'cell-tooltip';
  document.body.appendChild(el);
  return el;
})();

function showTooltip(e) {
  const geno = this.dataset.genotype;
  const pheno = this.dataset.phenotype;
  const analysis = analyzeGenotype(geno);
  const aStatus = analysis['A'] === 'dominant' ? 'Dominant' : 'Homozygous Rec.';
  const bStatus = analysis['B'] === 'dominant' ? 'Dominant' : 'Homozygous Rec.';
  tooltip.innerHTML = `
    <strong>${geno}</strong> → ${pheno}<br>
    Gene A: ${aStatus} &nbsp;|&nbsp; Gene B: ${bStatus}
  `;
  tooltip.classList.add('show');
}

function hideTooltip() {
  tooltip.classList.remove('show');
}

function moveTooltip(e) {
  tooltip.style.left = (e.clientX + 14) + 'px';
  tooltip.style.top  = (e.clientY - 10) + 'px';
}


function renderResults(result) {
  const model = MODELS[result.modelKey];


  document.getElementById('result-model-name').textContent = model.name;
  document.getElementById('result-ratio').textContent =
    'Ratio: ' + buildRatioString(result.counts);


  const totalCounted = result.modelKey === 'lethal'
    ? result.survivors
    : result.totalOffspring;

  document.getElementById('stat-total').textContent = result.totalOffspring;
  document.getElementById('stat-pheno').textContent = Object.keys(result.counts).length;
  document.getElementById('stat-geno').textContent = result.uniqueGenotypes;


  const lethalCard = document.getElementById('lethal-card');
  if (result.modelKey === 'lethal') {
    lethalCard.style.display = '';
    animateCounter(document.getElementById('alive-count'), result.survivors);
    animateCounter(document.getElementById('dead-count'), result.dead);
  } else {
    lethalCard.style.display = 'none';
  }


  const phenoList = document.getElementById('phenotype-list');
  phenoList.innerHTML = '';

  const maxCount = Math.max(...Object.values(result.counts));

  Object.entries(result.counts).forEach(([pheno, count], i) => {
    const style = PHENOTYPE_STYLES[pheno] || PHENOTYPE_STYLES.White;
    const pct = maxCount > 0 ? (count / maxCount * 100) : 0;

    const row = document.createElement('div');
    row.className = 'pheno-row';
    row.style.animationDelay = `${i * 80}ms`;

    row.innerHTML = `
      <span class="pheno-dot" style="background:${style.dot}"></span>
      <span class="pheno-label">${pheno}</span>
      <div class="pheno-bar-wrapper">
        <div class="pheno-bar" style="background:${style.dot}" data-pct="${pct}"></div>
      </div>
      <span class="pheno-count">${count}/16</span>
    `;

    phenoList.appendChild(row);


    requestAnimationFrame(() => {
      setTimeout(() => {
        const bar = row.querySelector('.pheno-bar');
        if (bar) bar.style.width = pct + '%';
      }, i * 80 + 100);
    });
  });


  renderLegend(result.modelKey);
}

function renderLegend(modelKey) {
  const legendGrid = document.getElementById('legend-grid');
  legendGrid.innerHTML = '';

  const rules = getLegendRules(modelKey);
  rules.forEach((rule, i) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.style.animationDelay = `${i * 60}ms`;

    const style = PHENOTYPE_STYLES[rule.phenotype] || PHENOTYPE_STYLES.White;
    item.innerHTML = `
      <span class="legend-color" style="background:${style.dot}"></span>
      <span>${rule.genotype} → ${rule.phenotype}</span>
    `;
    legendGrid.appendChild(item);
  });
}


function getLegendRules(modelKey) {
  switch (modelKey) {
    case 'mendelian':
      return [
        { genotype: 'A_B_', phenotype: 'Green'  },
        { genotype: 'A_bb', phenotype: 'Yellow' },
        { genotype: 'aaB_', phenotype: 'Blue'   },
        { genotype: 'aabb', phenotype: 'White'  },
      ];
    case 'complementary':
      return [
        { genotype: 'A_B_', phenotype: 'Green' },
        { genotype: 'Others', phenotype: 'White' },
      ];
    case 'recessive_epistasis':
      return [
        { genotype: 'A_B_', phenotype: 'Green'  },
        { genotype: 'A_bb', phenotype: 'Yellow' },
        { genotype: 'aa__', phenotype: 'White'  },
      ];
    case 'dominant_epistasis':
      return [
        { genotype: 'A___', phenotype: 'Purple' },
        { genotype: 'aaB_', phenotype: 'Blue'   },
        { genotype: 'aabb', phenotype: 'White'  },
      ];
    case 'duplicate':
      return [
        { genotype: 'A_ or B_', phenotype: 'Red'  },
        { genotype: 'aabb',     phenotype: 'White' },
      ];
    case 'suppression':
      return [
        { genotype: 'A_bb', phenotype: 'Green' },
        { genotype: 'B_ (any)', phenotype: 'White' },
        { genotype: 'aabb', phenotype: 'White' },
      ];
    case 'lethal':
      return [
        { genotype: 'AA or Aa', phenotype: 'Green' },
        { genotype: 'aa',       phenotype: 'Dead'  },
      ];
    default:
      return [];
  }
}

function animateCounter(el, target) {
  const duration = 600;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(t * target);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}


function runSimulation() {
  const p1Input = document.getElementById('parent1').value;
  const p2Input = document.getElementById('parent2').value;

  const p1Pairs = parseGenotype(p1Input);
  const p2Pairs = parseGenotype(p2Input);

  if (p1Pairs.length === 0 || p2Pairs.length === 0) {
    alert('Please enter valid genotypes (e.g. AaBb).');
    return;
  }

 
  const p1Gametes = generateGametes(p1Pairs);
  const p2Gametes = generateGametes(p2Pairs);


  if (p1Gametes.length !== 4 || p2Gametes.length !== 4) {
  
  }

  // Perform cross
  const grid = doPunnettCross(p1Gametes, p2Gametes);


  const allPhenotypes = [];
  const allGenotypes = [];
  const gridFlat = grid.flat();

  for (const genotype of gridFlat) {
    const phenotype = applyModel(genotype, currentModel);
    allPhenotypes.push(phenotype);
    allGenotypes.push(genotype);
  }

  let countedPhenotypes = allPhenotypes;
  let dead = 0;
  let survivors = allPhenotypes.length;

  if (currentModel === 'lethal') {
    dead = allPhenotypes.filter(p => p === 'Dead').length;
    survivors = allPhenotypes.length - dead;
    countedPhenotypes = allPhenotypes.filter(p => p !== 'Dead');
  }

  const counts = countPhenotypes(countedPhenotypes);


  const gridCounts = countPhenotypes(allPhenotypes);

  const uniqueGenotypes = new Set(allGenotypes).size;

  
  simulationResult = {
    modelKey: currentModel,
    p1Gametes,
    p2Gametes,
    grid,
    allPhenotypes,
    counts,
    totalOffspring: allPhenotypes.length,
    uniqueGenotypes,
    dead,
    survivors,
  };

 
  renderGametes(p1Gametes, p2Gametes);
  renderPunnettSquare(grid, p1Gametes, p2Gametes, currentModel);
  renderResults(simulationResult);
}


function setupModelButtons() {
  const btns = document.querySelectorAll('.model-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentModel = btn.dataset.model;

      // Update description
      const modelInfo = MODELS[currentModel];
      document.getElementById('model-description').textContent = modelInfo.description;
    });
  });
}



function setupInputHints() {
  ['parent1', 'parent2'].forEach(id => {
    const input = document.getElementById(id);
    const hintId = id === 'parent1' ? 'p1-hint' : 'p2-hint';
    const hint = document.getElementById(hintId);

    input.addEventListener('input', () => {
      const pairs = parseGenotype(input.value);
      if (pairs.length === 2) {
        hint.textContent = '✓';
        hint.style.color = '#00E676';
      } else if (pairs.length > 0) {
        hint.textContent = `${pairs.length} loci`;
        hint.style.color = '#FFD600';
      } else {
        hint.textContent = '';
      }
    });


    input.dispatchEvent(new Event('input'));
  });
}


function setupRunButton() {
  const btn = document.getElementById('run-btn');
  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.classList.add('loading');
    
    setTimeout(() => {
      runSimulation();
      btn.disabled = false;
      btn.classList.remove('loading');
    }, 120);
  });
}


document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    document.getElementById('run-btn').click();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setupModelButtons();
  setupInputHints();
  setupRunButton();
  setTimeout(() => {
    runSimulation();
  }, 600);
});