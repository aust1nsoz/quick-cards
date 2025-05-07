<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
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
