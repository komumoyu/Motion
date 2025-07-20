import { Heading } from "./_components/heading";
import { Heroes } from "./_components/heroes";
import { Footer } from "./_components/footer";

const MarketingPage = () => {
  return (
    <div className="min-h-full flex flex-col">
      <div
        className="
        flex flex-col               // Flexboxで縦方向に並べる
        items-center                // 横方向（X軸）の中央寄せ
        justify-center              // 縦方向（Y軸）の中央寄せ（モバイル時）

        md:justify-start            // 中画面以上で縦方向を上寄せに切り替え

        text-center                 // テキストを常に中央寄せ
        gap-y-8                     // 縦方向の子要素間に32pxの間隔
        flex-1                      // 親要素内で余白をすべて使う伸縮指定
        px-6                        // 左右に24pxのパディング
        pb-10                       // 下方向に40pxのパディング
      "
      >
        <Heading />
        <Heroes />
      </div>
      <Footer />
    </div>
  );
};

export default MarketingPage;
