let programsData = [];

async function loadPrograms() {
  const grid = document.getElementById('programsGrid');
  grid.innerHTML = '<div style="text-align:center;padding:40px;grid-column:1/-1;"><div class="spinner spinner-lg"></div></div>';
  try {
    const res = await fetch('/api/programs?per_page=50');
    const data = await res.json();
    programsData = data.items.map(p => ({
      id: p.id,
      company: p.company_name,
      industry: p.industry,
      maxReward: p.max_reward,
      desc: p.description || 'Programa de bug bounty activo.',
      tags: p.tags && p.tags.length ? p.tags : ['Web', 'API'],
      status: p.status === 'active' ? 'active' : 'new',
      hunters: p.hunters_count || 0,
      reports: p.reports_count || 0,
      daysActive: Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000) || 1,
    }));
    renderPrograms();
  } catch {
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary);grid-column:1/-1;">Error al cargar programas</div>';
  }
}

function renderPrograms() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const industry = document.getElementById('filterIndustry').value;
  const minReward = parseInt(document.getElementById('filterSeverity').value) || 0;
  const sort = document.getElementById('filterSort').value;

  let filtered = programsData.filter((p) => {
    const matchSearch =
      p.company.toLowerCase().includes(search) ||
      p.industry.toLowerCase().includes(search) ||
      p.tags.some((t) => t.toLowerCase().includes(search)) ||
      p.desc.toLowerCase().includes(search);
    const matchIndustry = !industry || p.industry === industry;
    const matchReward = p.maxReward >= minReward;
    return matchSearch && matchIndustry && matchReward;
  });

  if (sort === 'reward') filtered.sort((a, b) => b.maxReward - a.maxReward);
  else if (sort === 'reports') filtered.sort((a, b) => b.reports - a.reports);
  else filtered.sort((a, b) => a.daysActive - b.daysActive);

  document.getElementById('resultCount').textContent = `${filtered.length} programa${filtered.length !== 1 ? 's' : ''}`;
  const grid = document.getElementById('programsGrid');

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="programs-empty">
        <div class="programs-empty-icon"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="22" r="10"/><line x1="29" y1="29" x2="38" y2="38"/><line x1="18" y1="22" x2="26" y2="22" opacity="0.5"/></svg></div>
        <h3>No se encontraron programas</h3>
        <p style="font-size:14px;color:var(--text-tertiary);">Prueba con otros filtros o términos de búsqueda.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (p) => `
    <div class="program-card reveal visible">
      <div class="program-card-header">
        <div class="program-card-company">${p.company}</div>
        <span class="program-card-badge ${p.status}">${p.status === 'new' ? 'Nuevo' : 'Activo'}</span>
      </div>
      <div class="program-card-industry">${p.industry}</div>
      <div class="program-card-desc">${p.desc}</div>
      <div class="program-card-tags">
        ${p.tags.map((t) => `<span class="program-card-tag">${t}</span>`).join('')}
      </div>
      <div class="program-card-divider"></div>
      <div class="program-card-stats">
        <div class="program-card-stat">
          <div class="program-card-stat-value accent">${p.maxReward.toLocaleString()}€</div>
          <div class="program-card-stat-label">Máx. recompensa</div>
        </div>
        <div class="program-card-stat">
          <div class="program-card-stat-value green">${p.reports}</div>
          <div class="program-card-stat-label">Reportes</div>
        </div>
        <div class="program-card-stat">
          <div class="program-card-stat-value" style="color:var(--text-secondary)">${p.hunters}</div>
          <div class="program-card-stat-label">Hunters</div>
        </div>
        <div class="program-card-stat">
          <div class="program-card-stat-value" style="color:var(--text-tertiary)">${p.daysActive}d</div>
          <div class="program-card-stat-label">Activo</div>
        </div>
      </div>
      <button class="program-card-btn" onclick="window.location.href='/programas/${p.id}'">Ver programa →</button>
    </div>`
    )
    .join('');
}

loadPrograms();
