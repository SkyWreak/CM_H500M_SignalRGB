export function Name() { return "Cooler Master H500M"; }
export function VendorId() { return 0x2516;}
export function Documentation(){ return "troubleshooting/coolermaster"; }
export function ProductId() { return 0x1001;}
export function Publisher() { return "SkyWreak"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [1, 1];}
export function DefaultScale(){return 1.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
motherboardPass:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"motherboardPass", "group":"", "label":"Enable MotherBoard Passthrough", "type":"boolean", "default":"false"},
	];
}

const ParentDeviceName = "Cooler Master H500M";
export function SubdeviceController(){ return true; }
const DeviceMaxLedLimit = 196;
//Channel Name, Led Limit
const ChannelArray =
[
	["Channel 1", 48],
	["Channel 2", 48],
	["Channel 3", 48],
	["Channel 4", 48],
];

function SetupChannels(){
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++) {
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}

export function Initialize() {
	SetupChannels();
	setmotherboardPass(motherboardPass);
}

export function Render() {

	if(!motherboardPass){
		for(let channel = 0; channel < 4; channel++) {
			SendChannel(channel);
			device.pause(1);
		}
	}
}

export function Shutdown(SystemSuspending) {

	if(!motherboardPass){
		if(SystemSuspending){
			for(let channel = 0; channel < 4; channel++) {
				SendChannel(channel, "#000000");
				device.pause(1);
			}
		}else{
			for(let channel = 0; channel < 4; channel++) {
				SendChannel(channel, shutdownColor);
				device.pause(1);
			}
		}
	}
}

export function onmotherboardPassChanged() {
	setmotherboardPass(motherboardPass);
}

function setmotherboardPass(motherboardPass) {

	if(motherboardPass) {
		device.write([0x00, 0x80, 0x17, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		
	} else {
		device.write([0x00, 0x080, 0x01, 0x01], 65);
	}
}

function SendChannel(Channel, overrideColor) {

	let ChannelLedCount = device.channel(ChannelArray[Channel][0]).ledCount;
	const componentChannel = device.channel(ChannelArray[Channel][0]);

	let RGBData = [];

	if(LightingMode === "Forced"){
		RGBData = device.createColorArray(forcedColor, ChannelLedCount, "Inline");

	}else if(componentChannel.shouldPulseColors()){
		ChannelLedCount = 48;

		const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0]);
		RGBData = device.createColorArray(pulseColor, ChannelLedCount, "Inline");

	}else if(overrideColor){
		RGBData = device.createColorArray(overrideColor, ChannelLedCount, "Inline");
	}else{
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline");
	}

	device.write([0x00, 0x00, 0x10, 0x02, Channel, 0x30].concat(RGBData.splice(0, 59)), 65);

	device.write([0x00, 0x01].concat(RGBData.splice(0, 63)), 65);

	device.write([0x00, 0x82].concat(RGBData.splice(0, 62)), 65);
}

export function Validate(endpoint) {
	return endpoint.interface === 0;
}

export function Image() {
	return "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";
};
