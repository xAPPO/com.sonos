'use strict';

function getSpotifyMetadata(uri, serviceType) {
	return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
        xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
        <item id="00030020${uri}" restricted="true"><upnp:class>object.item.audioItem.musicTrack</upnp:class>
        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON${serviceType}_X_#Svc${serviceType}-0-Token</desc></item></DIDL-Lite>`;
}

async function spotify(player, values) {
	const action = values[0];
	const spotifyUri = values[1];
	const encodedSpotifyUri = encodeURIComponent(spotifyUri);
	const sid = player.system.getServiceId('Spotify');

	let uri;

	//check if current uri is either a track or a playlist/album
	if (spotifyUri.startsWith('spotify:track:')) {
		uri = `x-sonos-spotify:${encodedSpotifyUri}?sid=${sid}&flags=32&sn=1`;
	} else {
		uri = `x-rincon-cpcontainer:0006206c${encodedSpotifyUri}`;
	}

	const metadata = getSpotifyMetadata(encodedSpotifyUri, player.system.getServiceType('Spotify'));

	if (action === 'queue') {
		return player.coordinator.addURIToQueue(uri, metadata);
	} else if (action === 'now') {
		const nextTrackNo = player.coordinator.state.trackNo + 1;
		if (player.coordinator.avTransportUri.startsWith('x-rincon-queue') === false) {
			await player.coordinator.setAVTransport(`x-rincon-queue:${player.coordinator.uuid}#0`);
		}

		return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo)
			.then((addToQueueStatus) => player.coordinator.trackSeek(addToQueueStatus.firsttracknumberenqueued))

	} else if (action === 'next') {
		const nextTrackNo = player.coordinator.state.trackNo + 1;
		return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
	}
}

module.exports = function (api) {
	api.registerAction('spotify', spotify);
};


// Working SOAP Body
// <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
// <s:Body>
// <u:AddURIToQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
// <InstanceID>0</InstanceID>
// <EnqueuedURI>x-sonos-spotify:spotify%3Atrack%3A3AchVMlCSZhA3hMKkG7Kpe?sid=9&amp;flags=32&amp;sn=1</EnqueuedURI>
//
// <EnqueuedURIMetaData>
//
// <DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
// 	<item id="00030020spotify%3Atrack%3A3AchVMlCSZhA3hMKkG7Kpe" restricted="true">
// <upnp:class>object.item.audioItem.musicTrack</upnp:class>
// <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON2311_X_#Svc2311-0-Token</desc>
// </item>
// </DIDL-Lite>
//
// </EnqueuedURIMetaData>
// <DesiredFirstTrackNumberEnqueued>1</DesiredFirstTrackNumberEnqueued>
// <EnqueueAsNext>1</EnqueueAsNext>
// </u:AddURIToQueue>
// </s:Body>
// </s:Envelope>
