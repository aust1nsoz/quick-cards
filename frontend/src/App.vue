<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header>
      <div class="nav-container">
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
        </nav>
      </div>
    </header>

    <main>
      <div class="main-container">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style>
/* Reset default margins and padding */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

.app-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

header {
  width: 100%;
  background-color: #f8f9fa;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  color: #2c3e50;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: #e9ecef;
}

nav a.router-link-active {
  color: #42b983;
  font-weight: bold;
}

main {
  flex: 1;
  width: 100%;
}

.main-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
