<template>
	<div class="videoWrapper">
		{{ domId }}
		<div v-if="primaryStreamId == domId" class="videoButtonWrapper">
			<button @click="muteAudio">{{ audio ? "Mute" : "UnMute" }}</button>
			<button @click="muteVideo">{{ video ? "Mute Video" : "UnMute Video" }}</button>
			<button @click="shareScreen">{{ screen ? "Start Screen Share" : "Stop Screen Share" }}</button>
			<button @click="exitMeeting">Exit Meeting</button>
		</div>
		<div class="videoItemWrapper" ref="player" :id="domId"></div>
	</div>
</template>

<script>
	export default {
		name: "HelloWorld",
		data() {
			return {
				audio: true,
				video: true,
				screen: true
			};
		},
		mounted() {
			this.$nextTick(function() {
				console.log(this.stream);
				if (this.stream && !this.stream.isPlaying()) {
					this.stream.play(`${this.domId}`, { fit: "cover" }, err => {
						if (err && err.status !== "aborted") {
							console.warn("trigger autoplay policy");
						}
						console.log(err);
					});
				}
			});
		},
		methods: {
			muteAudio() {
				this.audio = !this.audio;
				this.$emit("setAudioStatus", this.audio);
			},
			muteVideo() {
				this.video = !this.video;
				this.$emit("setVideoStatus", this.video);
			},
			shareScreen() {
				this.screen = !this.screen;
				this.$emit("screenShare", this.screen);
			},
			exitMeeting() {
				this.$emit("jaraHuMai");
			}
		},
		beforeDestroy() {
			if (this.stream) {
				if (this.stream.isPlaying()) {
					this.stream.stop();
				}
				this.stream.close();
			}
		},
		props: ["domId", "stream", "primaryStreamId"]
	};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
	.videoItemWrapper {
		height: 100vh;
		width: auto;

		video {
			left: 0;
		}
	}
</style>
