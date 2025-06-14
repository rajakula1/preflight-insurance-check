
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Target, Wrench, AlertTriangle, Trophy, BookOpen, ArrowRight } from 'lucide-react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About the Project</h1>
        <p className="text-lg text-gray-600">
          Discover the story behind our Healthcare Insurance Verification System
        </p>
      </div>

      <div className="space-y-8">
        {/* Inspiration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
              Inspiration
            </CardTitle>
            <CardDescription>What drove us to create this solution</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              The healthcare industry faces significant challenges with insurance verification processes that are often 
              manual, time-consuming, and prone to errors. Healthcare providers spend countless hours on phone calls 
              with insurance companies, leading to delayed patient care and administrative burnout. We were inspired 
              to create a solution that leverages AI technology to streamline this critical process while maintaining 
              the highest standards of HIPAA compliance and data security.
            </p>
          </CardContent>
        </Card>

        {/* What it does */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-500" />
              What it does
            </CardTitle>
            <CardDescription>Core functionality and features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Our Healthcare Insurance Verification System revolutionizes the way healthcare providers handle 
                insurance verification and prior authorization processes:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">AI-Powered</Badge>
                  <span>Automatically verifies patient insurance eligibility using advanced AI (Gemini)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">Real-time</Badge>
                  <span>Provides instant verification results with intelligent status detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">HIPAA Compliant</Badge>
                  <span>Comprehensive audit logging and data protection with role-based access control</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">Automated</Badge>
                  <span>Streamlined prior authorization requests with clinical documentation support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">Analytics</Badge>
                  <span>Detailed compliance reports and performance metrics</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How we built it */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-green-500" />
              How we built it
            </CardTitle>
            <CardDescription>Technology stack and development approach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We built this system using modern web technologies and cloud services to ensure scalability, 
                security, and reliability:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Frontend Technologies</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• React 18 with TypeScript</li>
                    <li>• Vite for fast development</li>
                    <li>• Tailwind CSS for styling</li>
                    <li>• shadcn/ui components</li>
                    <li>• React Query for data management</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Backend & AI</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Supabase as backend-as-a-service</li>
                    <li>• PostgreSQL database</li>
                    <li>• Google Gemini AI integration</li>
                    <li>• Edge Functions for serverless processing</li>
                    <li>• Row Level Security (RLS)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Challenges we ran into
            </CardTitle>
            <CardDescription>Obstacles and how we overcame them</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Building a HIPAA-compliant healthcare application presented unique challenges:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li>
                  <strong>HIPAA Compliance:</strong> Implementing comprehensive audit logging and data protection 
                  while maintaining system performance required careful database design and security considerations.
                </li>
                <li>
                  <strong>AI Integration:</strong> Ensuring reliable AI-powered verification while handling API 
                  rate limits and providing meaningful fallbacks for edge cases.
                </li>
                <li>
                  <strong>Data Security:</strong> Implementing proper data masking, encryption, and access controls 
                  without compromising user experience.
                </li>
                <li>
                  <strong>Performance Optimization:</strong> Balancing comprehensive audit logging with database 
                  performance through strategic indexing and query optimization.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Accomplishments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-purple-500" />
              Accomplishments that we're proud of
            </CardTitle>
            <CardDescription>Key achievements and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We're proud of several key accomplishments in this project:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Security & Compliance</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Full HIPAA compliance implementation</li>
                    <li>• Comprehensive audit logging system</li>
                    <li>• Role-based access control</li>
                    <li>• Data masking and encryption</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Technical Excellence</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• AI-powered verification accuracy</li>
                    <li>• Real-time processing capabilities</li>
                    <li>• Scalable architecture</li>
                    <li>• User-friendly interface</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What we learned */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-500" />
              What we learned
            </CardTitle>
            <CardDescription>Key insights and knowledge gained</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                This project provided valuable learning experiences across multiple domains:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li>
                  <strong>Healthcare Compliance:</strong> Deep understanding of HIPAA requirements and the 
                  importance of comprehensive audit trails in healthcare applications.
                </li>
                <li>
                  <strong>AI Integration:</strong> Best practices for integrating AI services while maintaining 
                  reliability and handling edge cases gracefully.
                </li>
                <li>
                  <strong>Database Security:</strong> Advanced techniques for implementing Row Level Security 
                  and preventing recursive policy issues.
                </li>
                <li>
                  <strong>User Experience:</strong> Balancing security requirements with intuitive user interfaces 
                  for healthcare professionals.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* What's next */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-6 w-6 text-orange-500" />
              What's next for Healthcare Insurance Verification System
            </CardTitle>
            <CardDescription>Future roadmap and enhancements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We have exciting plans for the future development of this system:
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Short-term Goals</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Enhanced AI training for improved verification accuracy</li>
                    <li>• Mobile application development</li>
                    <li>• Additional insurance provider integrations</li>
                    <li>• Advanced analytics and reporting features</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Long-term Vision</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Full EHR (Electronic Health Record) integration</li>
                    <li>• Multi-language support for diverse patient populations</li>
                    <li>• Predictive analytics for prior authorization approvals</li>
                    <li>• Integration with healthcare payment systems</li>
                    <li>• Expansion to other healthcare administrative processes</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
