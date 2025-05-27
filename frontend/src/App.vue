<script setup lang="ts">
import { RouterView } from 'vue-router'
import logo from './assets/flash-forge-logo.png'
</script>

<template>
  <div class="app-bg">
    <header class="app-header">
      <img :src="logo" alt="Flash Forge Logo" class="logo" />
    </header>
    <main>
      <div class="main-container">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap');

.app-bg {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #fff8e4 0%, #fbeee0 100%);
  font-family: 'Montserrat', Arial, sans-serif;
}

.app-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0rem;
  margin-bottom: 0rem;
}

.logo {
  width: 320px;
  height: auto;
  margin-bottom: 0.0rem;
  display: block;
}

main {
  flex: 1;
  width: 100%;
}

.main-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 0 2rem 0;
}
</style>
