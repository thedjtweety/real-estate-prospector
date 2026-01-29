import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DetectedTechnology {
  platform: {
    id: string;
    name: string;
    category: 'crm' | 'mls' | 'transaction_management' | 'hybrid';
    description: string;
  };
  source: string;
  confidence: number;
  evidence: string;
}

interface TechnologyStackProps {
  technologies?: DetectedTechnology[];
  topTechnologies?: string[];
  overallConfidence?: number;
  summary?: string;
}

const categoryColors: Record<string, string> = {
  crm: 'bg-blue-100 text-blue-800',
  mls: 'bg-green-100 text-green-800',
  transaction_management: 'bg-purple-100 text-purple-800',
  hybrid: 'bg-orange-100 text-orange-800',
};

const categoryLabels: Record<string, string> = {
  crm: 'CRM',
  mls: 'MLS',
  transaction_management: 'Transaction Mgmt',
  hybrid: 'Hybrid',
};

const sourceIcons: Record<string, string> = {
  website_content: '🌐',
  meta_tags: '📋',
  scripts: '⚙️',
  links: '🔗',
  forms: '📝',
};

export function TechnologyStack({
  technologies = [],
  topTechnologies = [],
  overallConfidence = 0,
  summary = '',
}: TechnologyStackProps) {
  if (!technologies || technologies.length === 0) {
    return (
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🔧</span>
          Technology Stack
        </h3>
        <p className="text-gray-600">No transaction management platforms detected.</p>
      </Card>
    );
  }

  // Group technologies by platform
  const platformMap = new Map<string, DetectedTechnology[]>();
  for (const tech of technologies) {
    const key = tech.platform.id;
    if (!platformMap.has(key)) {
      platformMap.set(key, []);
    }
    platformMap.get(key)!.push(tech);
  }

  // Sort by confidence
  const sortedTechs = Array.from(platformMap.values())
    .map(group => ({
      platform: group[0].platform,
      detections: group,
      maxConfidence: Math.max(...group.map(g => g.confidence)),
    }))
    .sort((a, b) => b.maxConfidence - a.maxConfidence);

  return (
    <Card className="p-6 border-l-4 border-l-blue-500">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>🔧</span>
            Technology Stack
          </h3>
          <Badge variant="outline" className="bg-blue-50">
            {overallConfidence}% Confidence
          </Badge>
        </div>
        {summary && <p className="text-sm text-gray-600 mt-2">{summary}</p>}
      </div>

      <div className="space-y-4">
        {sortedTechs.map((tech) => (
          <div key={tech.platform.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{tech.platform.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{tech.platform.description}</p>
              </div>
              <Badge className={categoryColors[tech.platform.category]}>
                {categoryLabels[tech.platform.category]}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Confidence:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${tech.maxConfidence}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{tech.maxConfidence}%</span>
              </div>

              {tech.detections.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Detection Sources:</p>
                  {tech.detections.map((detection, idx) => (
                    <div key={idx} className="text-xs bg-gray-100 rounded p-2 flex items-start gap-2">
                      <span className="text-lg">{sourceIcons[detection.source] || '📌'}</span>
                      <div>
                        <p className="font-medium text-gray-800 capitalize">{detection.source.replace(/_/g, ' ')}</p>
                        <p className="text-gray-600">{detection.evidence}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>💡 Insight:</strong> Understanding the technology stack helps identify pain points and sales opportunities.
          These platforms are critical to the brokerage's operations.
        </p>
      </div>
    </Card>
  );
}
