import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { AvatarMascotId } from '../../types/profile';

export interface ZenMascot {
  id: AvatarMascotId;
  label: string;
  background: string;
}

export const ZEN_MASCOTS: ZenMascot[] = [
  { id: 'panda', label: 'Meditating Panda', background: '#EDF5EF' },
  { id: 'lotus', label: 'Lotus Blossom', background: '#FDF1F4' },
  { id: 'sun', label: 'Golden Sun', background: '#FFF6E5' },
  { id: 'oak', label: 'Forest Oak', background: '#EDF5EF' },
  { id: 'pebble', label: 'Zen Pebble', background: '#F3F0EA' },
  { id: 'moon', label: 'Crescent Moon', background: '#EEF2FB' },
];

export function mascotById(id: AvatarMascotId | undefined): ZenMascot {
  return ZEN_MASCOTS.find((mascot) => mascot.id === id) ?? ZEN_MASCOTS[1];
}

function Panda() {
  return (
    <G>
      <Circle cx={31} cy={29} r={13} fill="#2F3A36" />
      <Circle cx={69} cy={29} r={13} fill="#2F3A36" />
      <Circle cx={31} cy={29} r={6} fill="#C4A6A0" />
      <Circle cx={69} cy={29} r={6} fill="#C4A6A0" />
      <Circle cx={50} cy={52} r={31} fill="#FFFFFF" stroke="#E7E2D8" strokeWidth={1.5} />
      <Ellipse cx={38} cy={48} rx={8} ry={10} fill="#2F3A36" />
      <Ellipse cx={62} cy={48} rx={8} ry={10} fill="#2F3A36" />
      <Circle cx={38} cy={47} r={3} fill="#FFFFFF" />
      <Circle cx={62} cy={47} r={3} fill="#FFFFFF" />
      <Circle cx={39} cy={48} r={1.4} fill="#2F3A36" />
      <Circle cx={63} cy={48} r={1.4} fill="#2F3A36" />
      <Ellipse cx={50} cy={60} rx={4} ry={3} fill="#2F3A36" />
      <Path d="M50 63 Q46 68 42 65" stroke="#2F3A36" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M50 63 Q54 68 58 65" stroke="#2F3A36" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={30} cy={60} r={4} fill="#F6C6C8" opacity={0.8} />
      <Circle cx={70} cy={60} r={4} fill="#F6C6C8" opacity={0.8} />
      <Ellipse cx={38} cy={77} rx={9} ry={6} fill="#2F3A36" />
      <Ellipse cx={62} cy={77} rx={9} ry={6} fill="#2F3A36" />
    </G>
  );
}

function Lotus() {
  const petal = 'M50 62 C43 54 44 41 50 34 C56 41 57 54 50 62';
  return (
    <G>
      <G transform="rotate(-58 50 62)">
        <Path d={petal} fill="#F4B6C6" />
      </G>
      <G transform="rotate(58 50 62)">
        <Path d={petal} fill="#F4B6C6" />
      </G>
      <G transform="rotate(-30 50 62)">
        <Path d={petal} fill="#F8C8D4" />
      </G>
      <G transform="rotate(30 50 62)">
        <Path d={petal} fill="#F8C8D4" />
      </G>
      <Path d={petal} fill="#FBE0E7" />
      <Ellipse cx={50} cy={64} rx={13} ry={7} fill="#F7C84A" />
      <Circle cx={44} cy={63} r={1.4} fill="#B98422" />
      <Circle cx={50} cy={61} r={1.4} fill="#B98422" />
      <Circle cx={56} cy={63} r={1.4} fill="#B98422" />
      <Path d="M26 74 Q50 82 74 74" stroke="#C4DECA" strokeWidth={3} fill="none" strokeLinecap="round" />
    </G>
  );
}

function Sun() {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <G>
      {rays.map((angle) => (
        <Line
          key={angle}
          x1={50}
          y1={15}
          x2={50}
          y2={23}
          stroke="#F2B53C"
          strokeWidth={4}
          strokeLinecap="round"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <Circle cx={50} cy={50} r={23} fill="#F7C84A" />
      <Circle cx={42} cy={47} r={2.2} fill="#8A5A12" />
      <Circle cx={58} cy={47} r={2.2} fill="#8A5A12" />
      <Path d="M43 55 Q50 62 57 55" stroke="#8A5A12" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Circle cx={35} cy={54} r={4} fill="#F2A6A6" opacity={0.75} />
      <Circle cx={65} cy={54} r={4} fill="#F2A6A6" opacity={0.75} />
      <Path d="M28 78 Q50 84 72 78" stroke="#F2D28B" strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </G>
  );
}

function Oak() {
  return (
    <G>
      <Ellipse cx={50} cy={81} rx={28} ry={7} fill="#C4DECA" />
      <Rect x={45} y={55} width={10} height={24} rx={4} fill="#9A6B4F" />
      <Circle cx={50} cy={37} r={16} fill="#7DB391" />
      <Circle cx={34} cy={48} r={12} fill="#6FA078" />
      <Circle cx={66} cy={48} r={12} fill="#6FA078" />
      <Circle cx={50} cy={51} r={14} fill="#88BC98" />
      <Circle cx={44} cy={43} r={2.2} fill="#3F6B4C" />
      <Circle cx={56} cy={43} r={2.2} fill="#3F6B4C" />
      <Path d="M45 49 Q50 53 55 49" stroke="#3F6B4C" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={38} cy={48} r={3} fill="#F2A6A6" opacity={0.7} />
      <Circle cx={62} cy={48} r={3} fill="#F2A6A6" opacity={0.7} />
    </G>
  );
}

function Pebble() {
  return (
    <G>
      <Ellipse cx={50} cy={76} rx={30} ry={11} fill="#B9B2A6" />
      <Ellipse cx={50} cy={62} rx={21} ry={10} fill="#CFC8BB" />
      <Ellipse cx={50} cy={49} rx={12} ry={9} fill="#E0DACF" />
      <Circle cx={46} cy={48} r={1.5} fill="#6A655C" />
      <Circle cx={54} cy={48} r={1.5} fill="#6A655C" />
      <Path d="M47 52 Q50 54 53 52" stroke="#6A655C" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M50 40 C50 33 55 29 61 29 C60 36 55 40 50 40 Z" fill="#7DB391" />
      <Path d="M50 40 Q55 35 60 31" stroke="#4F7D5E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </G>
  );
}

function Moon() {
  return (
    <G>
      <Path d="M61 17 A34 34 0 1 0 61 83 A27 27 0 1 1 61 17 Z" fill="#F2D28B" />
      <Circle cx={39} cy={48} r={2} fill="#8A6A2A" />
      <Path d="M35 55 Q40 59 45 55" stroke="#8A6A2A" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={34} cy={59} r={3.5} fill="#F2A6A6" opacity={0.65} />
      <Path d="M25 28 L27 34 L33 36 L27 38 L25 44 L23 38 L17 36 L23 34 Z" fill="#F7E5B8" />
      <Path d="M76 62 L78 67 L83 69 L78 71 L76 76 L74 71 L69 69 L74 67 Z" fill="#F7E5B8" />
      <Circle cx={70} cy={35} r={2} fill="#F7E5B8" />
      <Circle cx={22} cy={62} r={1.6} fill="#F7E5B8" />
    </G>
  );
}

export function ZenMascotAvatar({ id, size = 88 }: { id: AvatarMascotId | undefined; size?: number }) {
  const mascot = mascotById(id);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={50} fill={mascot.background} />
      {mascot.id === 'panda' ? <Panda /> : null}
      {mascot.id === 'lotus' ? <Lotus /> : null}
      {mascot.id === 'sun' ? <Sun /> : null}
      {mascot.id === 'oak' ? <Oak /> : null}
      {mascot.id === 'pebble' ? <Pebble /> : null}
      {mascot.id === 'moon' ? <Moon /> : null}
    </Svg>
  );
}
