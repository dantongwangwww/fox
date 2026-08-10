<template>
	<div class="main">
		<Header />
		<div class="content">
			<div class="title">
				<h2>成果演示</h2>
				<!-- <p>Double Fox</p> -->
			</div>
			<div class="grid">
				<Card v-for="item in sceneInfoList" :key="item" :title="item.title" :description="item.description"
					:imageSrc="item.imageSrc" :targetUrl="item.targetUrl" />
			</div>
		</div>
	</div>
	<Footer />
</template>
<script setup>
import Card from "../components/Card.vue"
import Header from "../components/Header.vue"
import Footer from "../components/Footer.vue"
import sceneInfoList from "../data/homeListData.js"


</script>


<style lang="scss" scoped>
.main {
	margin-top: 78px;
	.content {
		width: 100%;
		margin-top: 32px;
		padding: 6px;
		margin: 0 auto;

		.title {
			margin-top: 6px;
			text-align: center;

			h2 {
				font-family: "Poppins", sans-serif !important;
				color: #1d3d62;
				font-size: 40px;
				line-height: 40px;
			}

			p {
				font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
				font-size: 0.875rem;
				/* 14px */
				line-height: 1.25rem;
				/* 20px */
				color: rgb(75 85 99);
			}
		}

		.grid {
			max-width: 1536px;
			margin: 20px auto;
			display: grid;
			grid-template-columns: repeat(1, minmax(0, 1fr));
			column-gap: 1rem;
			/* 16px */
			row-gap: 2rem;
			justify-items: center;

			/* 32px */
			@media screen and (width <=48rem) {
				justify-items: center;
			}

			@media screen and (width >=48rem) {
				max-width: 800px;
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}

			@media screen and (width >=64rem) {
				max-width: 960px;
				grid-template-columns: repeat(3, minmax(0, 1fr));
			}

			@media screen and (width >=80rem) {
				max-width: 1280px;
				grid-template-columns: repeat(4, minmax(0, 1fr));
			}
		}
	}
}

</style>