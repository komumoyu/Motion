import Image from "next/image";

export const Heroes = () => {
  return (
    <div className="flex flex-col items-center justify-center max-w-5xl">
      <div className="flex items-center">
        <div className="relative w-[300px] h-[300px] smw:w-[350px] sm:h-[350px] md:h-[400px] ,d:w-[400px]">
          <Image
            src="/Document.png"
            fill
            sizes="(max-width: 640px) 300px, (max-width: 768px) 350px, 400px"
            className="object-contain dark:hidden"
            alt="Documents"
          />
           <Image
            src="/Document_dark.png"
            fill
            sizes="(max-width: 640px) 300px, (max-width: 768px) 350px, 400px"
            className="object-contain dark:block hidden"
            alt="Documents"
          />
        </div>
        <div className="relative h-[400px] w-[400px] hidden md:block">
          <Image
            src="/Reading.png"
            fill
            sizes="400px"
            className="object-contain dark:hidden"
            alt="Reading"
          />
          <Image
            src="/Reading_dark.png"
            fill
            sizes="400px"
            className="object-contain dark:block hidden"
            alt="Reading"
          />
        </div>
      </div>
    </div>
  );
};
