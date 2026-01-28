import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Building2, Users, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const searchSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
}).refine(data => Object.values(data).some(val => val && val !== ""), {
  message: "At least one field must be filled",
});

type SearchFormData = z.infer<typeof searchSchema>;

export default function Home() {
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const searchMutation = trpc.prospect.search.useMutation({
    onSuccess: async (data) => {
      setIsSearching(false);
      toast.success("Search completed!");
      
      // Fetch full results
      if (data.searchId) {
        const results = await trpcUtils.results.getSearchResult.fetch({ searchId: data.searchId });
        setSearchResult(results);
      }
    },
    onError: (error) => {
      setIsSearching(false);
      toast.error(`Search failed: ${error.message}`);
    },
  });

  const trpcUtils = trpc.useUtils();

  const onSubmit = async (data: SearchFormData) => {
    setIsSearching(true);
    setSearchResult(null);
    searchMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-display font-bold text-navy-900">
          Super Scrubber
        </h1>
        <p className="text-xl text-navy-600 max-w-2xl mx-auto">
          Intelligent real estate prospecting powered by multi-source data aggregation and AI
        </p>
      </div>

      {/* Search Form */}
      <Card className="max-w-4xl mx-auto border-navy-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-navy-50 to-gold-50">
          <CardTitle className="text-2xl font-display flex items-center gap-2">
            <Search className="h-6 w-6 text-navy-700" />
            Business Search
          </CardTitle>
          <CardDescription className="text-navy-600">
            Enter any combination of business details to start your deep-dive research
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Primary Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Keller Williams Realty" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Fields */}
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Los Angeles" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="90210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  size="lg" 
                  className="flex-1"
                  onClick={() => {
                    form.reset();
                    setSearchResult(null);
                    toast.success("Form cleared");
                  }}
                  disabled={isSearching}
                >
                  Clear Form
                </Button>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex-1 bg-navy-700 hover:bg-navy-800"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Scrubbing data...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Start Deep Dive
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResult && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Business Overview */}
          {searchResult.business && (
            <Card className="border-navy-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-navy-50 to-gold-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-navy-700" />
                    <div>
                      <CardTitle className="text-2xl font-display">{searchResult.business.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {searchResult.business.verified ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Verified Business</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-yellow-600" />
                            <span>Unverified</span>
                          </>
                        )}
                        <Badge variant="outline" className="ml-2">
                          Confidence: {(parseFloat(searchResult.business.verificationScore || "0") * 100).toFixed(0)}%
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResult.business.phone && (
                    <div>
                      <p className="text-sm font-medium text-navy-700">Phone</p>
                      <p className="text-navy-900">{searchResult.business.phone}</p>
                    </div>
                  )}
                  {searchResult.business.email && (
                    <div>
                      <p className="text-sm font-medium text-navy-700">Email</p>
                      <p className="text-navy-900">{searchResult.business.email}</p>
                    </div>
                  )}
                  {searchResult.business.website && (
                    <div>
                      <p className="text-sm font-medium text-navy-700">Website</p>
                      <a href={searchResult.business.website} target="_blank" rel="noopener noreferrer" className="text-navy-600 hover:text-navy-800 underline">
                        {searchResult.business.website}
                      </a>
                    </div>
                  )}
                  {searchResult.business.address && (
                    <div>
                      <p className="text-sm font-medium text-navy-700">Address</p>
                      <p className="text-navy-900">
                        {searchResult.business.address}
                        {searchResult.business.city && `, ${searchResult.business.city}`}
                        {searchResult.business.state && `, ${searchResult.business.state}`}
                        {searchResult.business.zipCode && ` ${searchResult.business.zipCode}`}
                      </p>
                    </div>
                  )}
                </div>
                {searchResult.business.dataSource && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-navy-700">Data Sources</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {searchResult.business.dataSource.split(", ").map((source: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{source}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contacts */}
          {searchResult.contacts && searchResult.contacts.length > 0 && (
            <Card className="border-navy-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-navy-50 to-gold-50">
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <Users className="h-6 w-6 text-navy-700" />
                  Key Contacts ({searchResult.contacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {searchResult.contacts.map((contact: any) => (
                    <div key={contact.id} className="p-4 border border-navy-100 rounded-lg hover:border-navy-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-navy-900">{contact.name}</h3>
                            {contact.isPrimary && (
                              <Badge className="bg-gold-500">Primary Contact</Badge>
                            )}
                          </div>
                          {contact.title && (
                            <p className="text-navy-600">{contact.title}</p>
                          )}
                          {contact.role && (
                            <Badge variant="outline" className="capitalize">
                              {contact.role.replace(/_/g, " ")}
                            </Badge>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-navy-700">
                            {contact.email && (
                              <span>📧 {contact.email}</span>
                            )}
                            {contact.phone && (
                              <span>📞 {contact.phone}</span>
                            )}
                          </div>
                          {contact.roleConfidence && (
                            <p className="text-xs text-navy-500">
                              Role confidence: {(parseFloat(contact.roleConfidence) * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* MLS Associations */}
          {searchResult.mlsAssociations && searchResult.mlsAssociations.length > 0 && (
            <Card className="border-navy-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-navy-50 to-gold-50">
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-navy-700" />
                  MLS Associations ({searchResult.mlsAssociations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {searchResult.mlsAssociations.map((mls: any) => (
                    <div key={mls.id} className="flex items-center justify-between p-3 border border-navy-100 rounded-lg">
                      <div>
                        <p className="font-medium text-navy-900">{mls.name}</p>
                        {mls.state && (
                          <p className="text-sm text-navy-600">{mls.state}</p>
                        )}
                      </div>
                      <Badge variant={mls.type === "state" ? "default" : "secondary"} className="capitalize">
                        {mls.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
