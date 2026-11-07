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
  { id: 'bonsai', label: 'Zen Bonsai', background: '#EAF2EC' },
  { id: 'koi', label: 'Calm Koi', background: '#EBF4F6' },
  { id: 'cat', label: 'Sleepy Cat', background: '#FBF0EB' },
  { id: 'bell', label: 'Singing Bowl', background: '#F7F2E7' },
  { id: 'mountain', label: 'Misty Peak', background: '#EEF4F8' },
  { id: 'tea', label: 'Warm Matcha', background: '#F0F5EB' },
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

function Bonsai() {
  return (
    <G>
      {/* Stand / Pot */}
      <Rect x={32} y={72} width={36} height={10} rx={3} fill="#A67856" />
      <Rect x={29} y={70} width={42} height={4} rx={2} fill="#8C5E3D" />
      <Rect x={36} y={82} width={6} height={3} rx={1} fill="#8C5E3D" />
      <Rect x={58} y={82} width={6} height={3} rx={1} fill="#8C5E3D" />
      <Ellipse cx={50} cy={71} rx={18} ry={3} fill="#54835E" />
      {/* S-curved Zen Trunk */}
      <Path
        d="M48 71 C47 62 41 55 45 46 C47 41 53 38 52 30"
        stroke="#7A5239"
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M43 53 C36 50 31 51 28 54"
        stroke="#7A5239"
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M49 43 C56 40 62 42 66 45"
        stroke="#7A5239"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      {/* Foliage Pads */}
      <Ellipse cx={28} cy={52} rx={11} ry={7} fill="#4E875E" />
      <Ellipse cx={28} cy={49} rx={9} ry={5} fill="#62A073" />
      <Ellipse cx={66} cy={43} rx={12} ry={7.5} fill="#4E875E" />
      <Ellipse cx={66} cy={40} rx={10} ry={5.5} fill="#62A073" />
      <Ellipse cx={52} cy={27} rx={15} ry={9} fill="#41734F" />
      <Ellipse cx={52} cy={24} rx={12} ry={7} fill="#589668" />
      <Circle cx={48} cy={23} r={1.5} fill="#94CBA2" />
      <Circle cx={56} cy={24} r={1.2} fill="#94CBA2" />
    </G>
  );
}

function Koi() {
  return (
    <G>
      {/* Gentle pond ripple */}
      <Circle cx={50} cy={50} r={35} stroke="#CFE4EA" strokeWidth={1.5} strokeDasharray="3 4" fill="none" opacity={0.7} />
      {/* Coral Swimming Koi */}
      <Path
        d="M38 34 C44 26 56 26 62 34 C64 40 56 46 46 44 C40 42 36 38 38 34 Z"
        fill="#F47C5D"
      />
      <Path d="M62 34 Q70 29 74 35 Q68 37 63 36" fill="#F9A48F" />
      <Ellipse cx={44} cy={30} rx={4} ry={2.2} fill="#F9A48F" transform="rotate(-30 44 30)" />
      <Circle cx={39} cy={36} r={1.2} fill="#2F3A36" />
      <Ellipse cx={49} cy={34} rx={3} ry={2} fill="#FFFFFF" opacity={0.85} />
      {/* Pearl / Ink Swimming Koi (Yin-Yang complement) */}
      <Path
        d="M62 66 C56 74 44 74 38 66 C36 60 44 54 54 56 C60 58 64 62 62 66 Z"
        fill="#FFFFFF"
        stroke="#D9D2C7"
        strokeWidth={0.8}
      />
      <Path d="M38 66 Q30 71 26 65 Q32 63 37 64" fill="#E6DFD5" />
      <Ellipse cx={56} cy={70} rx={4} ry={2.2} fill="#E6DFD5" transform="rotate(-30 56 70)" />
      <Circle cx={61} cy={64} r={1.2} fill="#2F3A36" />
      <Ellipse cx={50} cy={66} rx={3.5} ry={2.2} fill="#3A4045" />
      {/* Little floating bubbles */}
      <Circle cx={32} cy={48} r={2} fill="#BCE0E8" />
      <Circle cx={68} cy={52} r={1.5} fill="#BCE0E8" />
    </G>
  );
}

function Cat() {
  return (
    <G>
      {/* Curled Body */}
      <Ellipse cx={50} cy={55} rx={27} ry={23} fill="#F3C38A" />
      <Ellipse cx={49} cy={57} rx={18} ry={15} fill="#FFF9F2" />
      <Path d="M62 43 C68 47 72 56 70 64 C64 60 62 49 62 43 Z" fill="#D98A55" />
      {/* Head */}
      <Circle cx={38} cy={46} r={14.5} fill="#F3C38A" />
      {/* Ears */}
      <Path d="M28 39 L25 28 L35 34 Z" fill="#D98A55" />
      <Path d="M28 38 L27 31 L33 35 Z" fill="#F6B8B8" />
      <Path d="M43 35 L49 26 L51 37 Z" fill="#F3C38A" />
      <Path d="M44 35 L48 29 L50 36 Z" fill="#F6B8B8" />
      {/* Sleeping peaceful face */}
      <Path d="M30 47 Q33 50 36 47" stroke="#684A35" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M40 47 Q43 50 46 47" stroke="#684A35" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M37 51 L39 51 L38 52.5 Z" fill="#E88F94" />
      <Circle cx={28} cy={51} r={3} fill="#F8B6B6" opacity={0.7} />
      <Circle cx={48} cy={51} r={3} fill="#F8B6B6" opacity={0.7} />
      {/* Curled Tail */}
      <Path
        d="M71 61 C77 69 69 77 56 77 C44 77 38 74 36 72"
        stroke="#D98A55"
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={44} cy={64} rx={4} ry={3} fill="#FFF9F2" />
    </G>
  );
}

function Bell() {
  return (
    <G>
      {/* Chime Harmonic Ripples */}
      <Circle cx={50} cy={52} r={38} stroke="#E5CE9F" strokeWidth={1.2} strokeDasharray="3 4" fill="none" opacity={0.65} />
      <Circle cx={50} cy={52} r={28} stroke="#DEC084" strokeWidth={1.2} fill="none" opacity={0.4} />
      {/* Bowl Base Cushion */}
      <Ellipse cx={50} cy={76} rx={14} ry={4} fill="#8A6730" />
      {/* Bronze Singing Bowl Body */}
      <Path d="M24 50 C24 74 76 74 76 50 Z" fill="#C99E52" stroke="#9E7631" strokeWidth={1.5} />
      {/* Bowl Rim */}
      <Ellipse cx={50} cy={50} rx={26} ry={7} fill="#B88A3B" stroke="#9E7631" strokeWidth={1.5} />
      <Ellipse cx={50} cy={50} rx={22} ry={5} fill="#DDB66B" />
      <Path d="M28 58 Q50 68 72 58" stroke="#8A6730" strokeWidth={1.2} fill="none" />
      {/* Striker / Mallet */}
      <Rect x={66} y={30} width={6} height={36} rx={3} fill="#7A4E2D" transform="rotate(28 66 30)" />
      <Rect x={66} y={48} width={6} height={16} rx={2} fill="#A64B3B" transform="rotate(28 66 30)" />
      {/* Mindful Chime Spark */}
      <Path d="M50 26 L51.5 31 L56 32 L51.5 33 L50 38 L48.5 33 L44 32 L48.5 31 Z" fill="#E6B443" />
    </G>
  );
}

function Mountain() {
  return (
    <G>
      {/* Serene Dawn Sun */}
      <Circle cx={50} cy={44} r={16} fill="#F9C87C" opacity={0.85} />
      {/* Distant Ridge */}
      <Path d="M16 78 L38 52 L60 78 Z" fill="#A8BFD3" />
      {/* Main Majestic Peak */}
      <Path d="M28 78 L50 38 L72 78 Z" fill="#5F7B95" />
      {/* Snowcap */}
      <Path d="M50 38 L43 51 L46 50 L50 53 L54 50 L57 51 Z" fill="#FFFFFF" />
      {/* Floating Zen Mist */}
      <Path d="M20 72 Q36 67 52 71 Q68 75 82 71" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.8} />
      <Path d="M30 63 Q44 59 58 63" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.65} />
      {/* Pine Tree Accent */}
      <Path d="M72 78 L74 71 L76 78 Z" fill="#3D5163" />
    </G>
  );
}

function Tea() {
  return (
    <G>
      {/* Wooden / Bamboo Coaster */}
      <Ellipse cx={50} cy={76} rx={29} ry={7} fill="#C7B299" stroke="#9E876E" strokeWidth={1} />
      <Path d="M27 76 L73 76" stroke="#9E876E" strokeWidth={0.8} strokeDasharray="3 3" />
      {/* Ceramic Matcha Chawan */}
      <Path d="M26 48 C26 73 74 73 74 48 Z" fill="#4A5B52" />
      <Ellipse cx={50} cy={48} rx={24} ry={6.5} fill="#5C7065" stroke="#3A4840" strokeWidth={1} />
      {/* Green Matcha Surface */}
      <Ellipse cx={50} cy={49} rx={21} ry={5} fill="#82A752" />
      <Path d="M43 49 Q48 46 52 49 Q55 51 58 49" stroke="#A7C777" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {/* Rising Steam Spirals */}
      <Path d="M42 38 C39 32 44 26 41 20" stroke="#B8CBBF" strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d="M50 36 C47 30 52 24 49 17" stroke="#B8CBBF" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Path d="M58 39 C55 33 60 27 57 21" stroke="#B8CBBF" strokeWidth={2} strokeLinecap="round" fill="none" />
    </G>
  );
}

export interface ZenMascotAvatarProps {
  id: AvatarMascotId | undefined;
  size?: number;
  shape?: 'square' | 'circle';
  borderRadius?: number;
}

export function ZenMascotAvatar({
  id,
  size = 88,
  shape = 'square',
  borderRadius = 0,
}: ZenMascotAvatarProps) {
  const mascot = mascotById(id);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {shape === 'circle' ? (
        <Circle cx={50} cy={50} r={50} fill={mascot.background} />
      ) : (
        <Rect
          x={0}
          y={0}
          width={100}
          height={100}
          rx={borderRadius}
          ry={borderRadius}
          fill={mascot.background}
        />
      )}
      {mascot.id === 'panda' ? <Panda /> : null}
      {mascot.id === 'lotus' ? <Lotus /> : null}
      {mascot.id === 'sun' ? <Sun /> : null}
      {mascot.id === 'oak' ? <Oak /> : null}
      {mascot.id === 'pebble' ? <Pebble /> : null}
      {mascot.id === 'moon' ? <Moon /> : null}
      {mascot.id === 'bonsai' ? <Bonsai /> : null}
      {mascot.id === 'koi' ? <Koi /> : null}
      {mascot.id === 'cat' ? <Cat /> : null}
      {mascot.id === 'bell' ? <Bell /> : null}
      {mascot.id === 'mountain' ? <Mountain /> : null}
      {mascot.id === 'tea' ? <Tea /> : null}
    </Svg>
  );
}
