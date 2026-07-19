import { useT } from '../i18n/LanguageContext';

export default function AeroStripe() {
  const { t } = useT();
  return (
    <div className="aero-chamfer flex h-2.5 w-full overflow-hidden bg-black border border-aero-border">
      <span
        className="border-r border-white/10"
        style={{ width: "40%", backgroundColor: "#1a1a24" }}
        title={t('aero.black')}
      />
      <span
        style={{
          width: "35%",
          backgroundColor: "#a855f7",
          boxShadow: "0 0 15px rgba(168,85,247,0.4)",
        }}
        title={t('aero.lilas')}
      />
      <span
        style={{
          width: "15%",
          backgroundColor: "#f59e0b",
          boxShadow: "0 0 15px rgba(245,158,11,0.4)",
        }}
        title={t('aero.gold')}
      />
      <span style={{ width: "10%", backgroundColor: "#ffffff" }} title={t('aero.white')} />
    </div>
  );
}
