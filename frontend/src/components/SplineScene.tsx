import Spline from '@splinetool/react-spline';

const SCENE_URL = 'https://prod.spline.design/7p8MjvZD7PZzRnKf/scene.splinecode';

export default function SplineScene() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <Spline scene={SCENE_URL} className="w-full h-full" />
    </div>
  );
}
