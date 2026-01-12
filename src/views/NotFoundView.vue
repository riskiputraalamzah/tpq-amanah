<template>
  <div class="not-found">
    <div class="container">
      <div class="not-found-content glass-card animate-fadeInUp">
        <div class="not-found-icon">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <h1>404</h1>
        <p>Halaman yang Anda cari tidak ditemukan</p>
        <router-link to="/" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Kembali ke Beranda
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  padding: var(--space-xl);
}

.not-found-content {
  text-align: center;
  padding: var(--space-3xl);
  max-width: 500px;
  margin : 0 auto;
  background: rgba(255, 255, 255, 0.95);
}

.not-found-icon {
  color: var(--gray-400);
  margin-bottom: var(--space-lg);
  display: flex;
  justify-content: center;
}

.not-found h1 {
  font-size: 6rem;
  color: var(--primary);
  line-height: 1;
  margin-bottom: var(--space-md);
}

.not-found p {
  color: var(--gray-600);
  font-size: 1.125rem;
  margin-bottom: var(--space-xl);
}
</style>
