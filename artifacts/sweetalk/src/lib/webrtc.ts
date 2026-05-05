import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let peerConnection: RTCPeerConnection | null = null;

function getPeer(): RTCPeerConnection {
  if (!peerConnection || peerConnection.signalingState === "closed") {
    peerConnection = new RTCPeerConnection(ICE_SERVERS);
  }
  return peerConnection;
}

export function closePeer() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
}

export async function createOffer(
  roomId: string,
  localStream: MediaStream,
  callerId: string,
  calleeId: string,
  type: "voice" | "video"
): Promise<RTCPeerConnection> {
  const pc = getPeer();
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await setDoc(doc(db, "calls", roomId), {
    offer: { type: offer.type, sdp: offer.sdp },
    answer: null,
    status: "calling",
    type,
    callerId,
    calleeId,
    startedAt: new Date(),
    endedAt: null,
  });

  pc.onicecandidate = async (e) => {
    if (e.candidate) {
      await addDoc(collection(db, "calls", roomId, "callerCandidates"), e.candidate.toJSON());
    }
  };

  onSnapshot(doc(db, "calls", roomId), async (snap) => {
    const data = snap.data();
    if (data?.answer && pc.signalingState !== "stable") {
      const answerDesc = new RTCSessionDescription(data.answer);
      await pc.setRemoteDescription(answerDesc);
    }
  });

  onSnapshot(collection(db, "calls", roomId, "calleeCandidates"), (snap) => {
    snap.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });

  return pc;
}

export async function createAnswer(
  roomId: string,
  localStream: MediaStream
): Promise<RTCPeerConnection> {
  const pc = getPeer();
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  const snap = await getDoc(doc(db, "calls", roomId));
  const data = snap.data();
  if (!data?.offer) throw new Error("No offer found");

  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await updateDoc(doc(db, "calls", roomId), {
    answer: { type: answer.type, sdp: answer.sdp },
    status: "active",
  });

  pc.onicecandidate = async (e) => {
    if (e.candidate) {
      await addDoc(collection(db, "calls", roomId, "calleeCandidates"), e.candidate.toJSON());
    }
  };

  onSnapshot(collection(db, "calls", roomId, "callerCandidates"), (snap) => {
    snap.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });

  return pc;
}

export async function endCall(roomId: string) {
  closePeer();
  try {
    await deleteDoc(doc(db, "calls", roomId));
  } catch {}
}

export function subscribeToCallDoc(
  roomId: string,
  callback: (data: Record<string, unknown> | null) => void
) {
  return onSnapshot(doc(db, "calls", roomId), (snap) => {
    callback(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
  });
}
