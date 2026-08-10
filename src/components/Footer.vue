<template>
  <footer>
    <div class="main">
      <div class="content">
        <p>©[2023] 北京金双狐油气技术有限公司</p>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
footer {
  width: 100%;
  color: rgb(55 65 81);
  .main {
    background-color: rgb(236, 237, 238);
    .content {
      width: 100%;
      padding: 10px 5px;
      margin: 0 auto;
      p {
        text-transform: capitalize;
        font-size: 0.875rem;
        /* 14px */
        line-height: 1.25rem;
        /* 20px */
        color: rgb(55 65 81);
        @media screen and (min-width: 640px) {
          text-align: center;
        }
      }
    }
  }
}
</style>