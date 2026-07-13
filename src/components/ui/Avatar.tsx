interface AvatarProps {
  name: string;
}

export function Avatar({ name }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid h-10 w-10 place-items-center rounded-full border border-[#dedede] bg-[#245855]/10 text-sm font-black text-[#245855]">
      {initials}
    </div>
  );
}
