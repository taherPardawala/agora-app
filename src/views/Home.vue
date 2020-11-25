<template>
	<div class="meetingSectionWrapper">
		<div v-if="!jointMeeting" class="meetingDetails">
			<input v-model="appid" type="text" placeholder="enter appid" />
			<input v-model="channel" type="text" placeholder="enter channel name" />
			<button @click="startMeeting">Join Meeting</button>
		</div>
		<div v-if="jointMeeting" class="primaryStreamWrapper">
			<HelloWorld
				@setVideoStatus="updateVideoStatus"
				@setAudioStatus="updateAudioStatus"
				@jaraHuMai="leaveMeeting"
				:primaryStreamId="primaryStream.id"
				:stream="primaryStream.stream"
				:domId="primaryStream.id"
			/>
		</div>
		<div class="remoteStreamWrapper">
			<HelloWorld
				v-for="stream of secondaryStream"
				:primaryStreamId="primaryStream.id"
				:stream="stream.stream"
				:domId="stream.id"
				:key="stream.id"
			/>
		</div>
	</div>
</template>

<script>
	// @ is an alias to /src
	import HelloWorld from "@/components/HelloWorld.vue";
	import RTCClient from "../helpers/AgoraClientWrapper";

	export default {
		name: "Home",
		components: {
			HelloWorld
		},
		async created() {
			this.rtc = new RTCClient();
			let rtc = this.rtc;

			if (rtc.testSystemRequirements()) {
				let devices = await rtc.testDevices();

				if (devices.audioDevices && !devices.audioDevices.length) {
					this.rtc.videoStreamConfig.audio = false;
				}
				if (devices.videoDevices && !devices.videoDevices.length) {
					this.rtc.videoStreamConfig.video = false;
				}

				// write additional code here
				rtc.on("stream-added", evt => {
					let { stream } = evt;
					console.log("[agora] [stream-added] stream-added", stream.getId());
					rtc.client.subscribe(stream);
				});

				rtc.on("stream-subscribed", evt => {
					let { stream } = evt;
					console.log("[agora] [stream-subscribed] stream-added", stream.getId());
					if (!this.secondaryStream.find(it => it.id === stream.getId())) {
						this.secondaryStream.push({ stream, id: stream.getId() });
					}
				});

				rtc.on("stream-removed", evt => {
					let { stream } = evt;
					console.log("[agora] [stream-removed] stream-removed", stream.getId());
					this.secondaryStream = this.secondaryStream.filter(it => it.id !== stream.getId());
				});

				rtc.on("peer-online", evt => {
					console.log(`PEER ${evt.uid} IS ONLINE`);
				});

				rtc.on("peer-leave", evt => {
					console.log(`PEER ${evt.uid} ALREADY LEFT`);
					this.secondaryStream = this.secondaryStream.filter(it => it.id !== evt.uid);
				});

				rtc.on("mute-audio", function(evt) {
					console.log("Remote stream: " + evt.uid + "has muted audio");
				});

				rtc.on("unmute-audio", function(evt) {
					console.log("Remote stream: " + evt.uid + "has muted audio");
				});

				// show user icon whenever a remote has disabled their video
				rtc.on("mute-video", function(evt) {
					console.log("Remote stream: " + evt.uid + "has muted video");
				});

				rtc.on("unmute-video", function(evt) {
					console.log("Remote stream: " + evt.uid + "has un-muted video");
				});
			} else {
				console.log("Browser badal Garib.");
			}
		},
		data() {
			return {
				jointMeeting: false,
				primaryStream: {
					id: "",
					stream: ""
				},
				localStream: {
					id: "",
					stream: ""
				},
				secondaryStream: [],
				rtc: false,
				appid: "824340cbb84f429283930d38448d5d08",
				channel: "meraphelebarhai1"
			};
		},
		methods: {
			startMeeting() {
				this.rtc
					.joinChannel({
						appid: this.appid,
						channel: this.channel
					})
					.then(() => {
						console.log("JOIN HO GAYA SUCCESS");
						this.rtc
							.publishStream()
							.then(stream => {
								console.log("PUBLISH STREAM HO GAYA SUCCESS", stream);
								this.primaryStream.stream = this.localStream.stream = stream;
								this.primaryStream.id = this.localStream.id = stream.getId();
								this.jointMeeting = true;
							})
							.catch(err => {
								console.log("publish local error", err);
							});
					})
					.catch(err => {
						console.log("join channel error", err);
					});
			},
			updateVideoStatus(status) {
				if (!status) {
					this.rtc.localStream.camera.stream.muteVideo();
				} else {
					this.rtc.localStream.camera.stream.unmuteVideo();
				}
			},
			updateAudioStatus(status) {
				if (!status) {
					this.rtc.localStream.camera.stream.muteAudio();
				} else {
					this.rtc.localStream.camera.stream.unmuteAudio();
				}
			},
			leaveMeeting() {
				this.jointMeeting = false;
				this.rtc
					.leaveChannel()
					.then(() => {
						console.log("Leave Success");
					})
					.catch(err => {
						console.log("Leave Failure");
					});
				this.primaryStream = this.localStream = {
					id: "",
					stream: ""
				};
				this.secondaryStream = [];
			}
		}
	};
</script>
