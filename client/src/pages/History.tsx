import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Clock, Search, CheckCircle2, XCircle, Loader2, Eye } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function History() {
  const [selectedSearch, setSelectedSearch] = useState<number | null>(null);
  
  const { data: history, isLoading } = trpc.results.getSearchHistory.useQuery({ limit: 50 });
  const { data: searchResult } = trpc.results.getSearchResult.useQuery(
    { searchId: selectedSearch! },
    { enabled: !!selectedSearch }
  );

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
        <h1 className="text-4xl font-display font-bold text-navy-900">Search History</h1>
        <p className="text-navy-600 mt-2">Review your past searches and results</p>
      </div>

      {!history || history.length === 0 ? (
        <Card className="border-navy-200">
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-navy-300 mx-auto mb-4" />
            <p className="text-navy-600">No search history yet. Start a new search to begin!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search History List */}
          <div className="space-y-4">
            {history.map((search) => (
              <Card 
                key={search.id} 
                className={`border-navy-200 cursor-pointer transition-all hover:shadow-md ${
                  selectedSearch === search.id ? "ring-2 ring-navy-500" : ""
                }`}
                onClick={() => setSelectedSearch(search.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <Search className="h-5 w-5 text-navy-600" />
                        {typeof search.searchQuery === "object" && search.searchQuery !== null
                          ? (search.searchQuery as any).name || "Multi-field Search"
                          : "Search"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {format(new Date(search.createdAt), "PPp")}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        search.status === "completed"
                          ? "default"
                          : search.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {search.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {search.status === "completed" && (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{search.resultsCount || 0} result(s) found</span>
                      </div>
                    )}
                    {search.status === "failed" && (
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-4 w-4" />
                        <span>Search failed</span>
                      </div>
                    )}
                    {search.processingTime && (
                      <p className="text-navy-600">
                        Processing time: {(search.processingTime / 1000).toFixed(2)}s
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search Result Detail */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            {!selectedSearch ? (
              <Card className="border-navy-200">
                <CardContent className="py-12 text-center">
                  <Eye className="h-12 w-12 text-navy-300 mx-auto mb-4" />
                  <p className="text-navy-600">Select a search to view details</p>
                </CardContent>
              </Card>
            ) : searchResult ? (
              <div className="space-y-4">
                {/* Business Details */}
                {searchResult.business && (
                  <Card className="border-navy-200">
                    <CardHeader className="bg-gradient-to-r from-navy-50 to-gold-50">
                      <CardTitle className="font-display">{searchResult.business.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {searchResult.business.verified ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-yellow-600" />
                            <span>Unverified</span>
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
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
                          <a
                            href={searchResult.business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-navy-600 hover:text-navy-800 underline"
                          >
                            {searchResult.business.website}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Contacts */}
                {searchResult.contacts && searchResult.contacts.length > 0 && (
                  <Card className="border-navy-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-display">
                        Contacts ({searchResult.contacts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {searchResult.contacts.map((contact: any) => (
                        <div key={contact.id} className="p-3 border border-navy-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-navy-900">{contact.name}</p>
                            {contact.isPrimary && (
                              <Badge className="bg-gold-500 text-xs">Primary</Badge>
                            )}
                          </div>
                          {contact.title && (
                            <p className="text-sm text-navy-600">{contact.title}</p>
                          )}
                          {contact.role && (
                            <Badge variant="outline" className="text-xs capitalize mt-1">
                              {contact.role.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* MLS Associations */}
                {searchResult.mlsAssociations && searchResult.mlsAssociations.length > 0 && (
                  <Card className="border-navy-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-display">
                        MLS Associations ({searchResult.mlsAssociations.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {searchResult.mlsAssociations.map((mls: any) => (
                        <div key={mls.id} className="flex items-center justify-between p-2 border border-navy-100 rounded">
                          <span className="text-sm text-navy-900">{mls.name}</span>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {mls.type}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-navy-200">
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-navy-600 mx-auto" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
