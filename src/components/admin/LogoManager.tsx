
import { Button } from "@/components/ui/button";
import { useLogos } from "@/hooks/useLogos";
import { LogoItem } from "./LogoItem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const LogoManager = () => {
  const {
    logos,
    loading,
    pendingUploads,
    handleImageUpload,
    handleSaveLogo,
    handleRemoveLogo,
    handleAddLogo,
  } = useLogos();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Partner Logos</CardTitle>
        <CardDescription>Add or update logos displayed in the partners section of the homepage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-6">
          {logos.map((logo) => (
            <LogoItem
              key={logo.id}
              logo={logo}
              pendingUpload={pendingUploads.find(p => p.logoId === logo.id)}
              onUpload={handleImageUpload}
              onSave={handleSaveLogo}
              onRemove={handleRemoveLogo}
            />
          ))}
        </div>

        <Button 
          className="mt-4"
          onClick={handleAddLogo}
        >
          Add New Partner Logo
        </Button>
        
        <div className="text-sm text-muted-foreground mt-4">
          <p>Note: The homepage partner section now supports up to 7 logos.</p>
        </div>
      </CardContent>
    </Card>
  );
};
