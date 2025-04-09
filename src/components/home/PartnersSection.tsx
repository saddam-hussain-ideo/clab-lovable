
interface PartnerLogo {
  id: number;
  name: string;
  image_url: string;
}

interface PartnersSectionProps {
  logos: PartnerLogo[] | undefined;
}

export const PartnersSection = ({ logos }: PartnersSectionProps) => {
  return (
    <section className="py-16 px-8 bg-black/30">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-8 items-center justify-items-center">
          {logos?.map((logo) => (
            <div key={logo.id} className="w-full max-w-[150px]">
              {logo.image_url && (
                <img
                  src={logo.image_url}
                  alt={logo.name}
                  className="w-full h-auto object-contain filter brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    console.error('Failed to load logo:', logo.image_url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
