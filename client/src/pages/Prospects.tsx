import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

export default function Prospects() {
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  
  const { data: prospects, isLoading } = trpc.results.getSavedProspects.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-navy-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold text-navy-900">Saved Prospects</h1>
        <p className="text-navy-600 mt-2">Manage your discovered businesses and contacts</p>
      </div>

      {!prospects || prospects.length === 0 ? (
        <Card className="border-navy-200">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-navy-300 mx-auto mb-4" />
            <p className="text-navy-600">No prospects saved yet. Perform a search to discover businesses!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prospects.map((business) => (
            <Card key={business.id} className="border-navy-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-display">{business.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {business.city && business.state ? `${business.city}, ${business.state}` : business.state || "Location unknown"}
                    </CardDescription>
                  </div>
                  {business.verified ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {business.phone && <p className="text-sm text-navy-700">Phone: {business.phone}</p>}
                  {business.email && <p className="text-sm text-navy-700">Email: {business.email}</p>}
                  {business.verificationScore && (
                    <Badge variant="outline" className="text-xs">
                      {(parseFloat(business.verificationScore) * 100).toFixed(0)}% confidence
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
