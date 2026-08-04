import { useT } from '../i18n/LanguageContext';

export default function AeroStripe() {
  const { t } = useT();
  return (
    <div className="aero-chamfer flex h-2.5 w-full overflow-hidden bg-[#E8D9F5] border border-aero-border">
      <span
        className="border-r border-gray-300"
        style={{ width: "40%", backgroundColor: "#f7f3ff" }}
        title={t('aero.black')}
      />
      <span
        style={{
          width: "35%",
          backgroundColor: "#DDB8FA",
          boxShadow: "0 0 15px rgba(221,184,250,0.4)",
        }}
        title={t('aero.lilas')}
      />
      <span
        style={{
          width: "15%",
          backgroundColor: "#D4AF37",
          boxShadow: "0 0 15px rgba(212,175,55,0.4)",
        }}
        title={t('aero.gold')}
      />
      <span style={{ width: "10%", backgroundColor: "#D4B5FF" }} title={t('aero.white')} />
    </div>
  );
}



