
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, X, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { VerificationResult } from "@/pages/Index";

interface DashboardNotification {
  id: string;
  type: 'verification_alert' | 'system_message' | 'reminder';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: string;
  read: boolean;
  verification?: VerificationResult;
  actionRequired?: boolean;
}

interface DashboardNotificationsProps {
  verifications: VerificationResult[];
}

const DashboardNotifications = ({ verifications }: DashboardNotificationsProps) => {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Generate notifications from verification results
    const newNotifications: DashboardNotification[] = [];

    verifications.forEach((verification) => {
      if (verification.status === 'ineligible' || verification.status === 'requires_auth' || verification.status === 'error') {
        newNotifications.push({
          id: `verification-${verification.id}`,
          type: 'verification_alert',
          title: getNotificationTitle(verification),
          message: getNotificationMessage(verification),
          urgency: getNotificationUrgency(verification.status),
          timestamp: verification.timestamp,
          read: false,
          verification,
          actionRequired: true,
        });
      }
    });

    // Add system notifications
    if (verifications.length > 0) {
      const todayVerifications = verifications.filter(v => 
        new Date(v.timestamp).toDateString() === new Date().toDateString()
      );
      
      if (todayVerifications.length > 0) {
        newNotifications.push({
          id: 'daily-summary',
          type: 'system_message',
          title: 'Daily Verification Summary',
          message: `Processed ${todayVerifications.length} verification${todayVerifications.length > 1 ? 's' : ''} today`,
          urgency: 'low',
          timestamp: new Date().toISOString(),
          read: false,
          actionRequired: false,
        });
      }
    }

    setNotifications(newNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  }, [verifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  const getNotificationIcon = (type: DashboardNotification['type'], urgency: DashboardNotification['urgency']) => {
    if (type === 'verification_alert') {
      switch (urgency) {
        case 'high':
          return <AlertTriangle className="h-4 w-4 text-red-600" />;
        case 'medium':
          return <Clock className="h-4 w-4 text-yellow-600" />;
        default:
          return <Bell className="h-4 w-4 text-blue-600" />;
      }
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getUrgencyColor = (urgency: DashboardNotification['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </div>
          {notifications.length > 5 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All (${notifications.length})`}
            </Button>
          )}
        </div>
        <CardDescription>
          Recent alerts and system messages requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayNotifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-3 rounded-lg border ${notification.read ? 'bg-gray-50' : 'bg-white'} ${
                notification.actionRequired ? 'border-l-4 border-l-orange-400' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {getNotificationIcon(notification.type, notification.urgency)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      <Badge className={getUrgencyColor(notification.urgency)} variant="outline">
                        {notification.urgency}
                      </Badge>
                      {notification.actionRequired && (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200" variant="outline">
                          Action Required
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs"
                    >
                      Mark Read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {notification.verification && notification.actionRequired && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex gap-2">
                    {notification.verification.status === 'requires_auth' && (
                      <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                        Initiate Prior Auth
                      </Button>
                    )}
                    {notification.verification.status === 'ineligible' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Contact Patient
                      </Button>
                    )}
                    {notification.verification.status === 'error' && (
                      <Button size="sm" variant="outline">
                        Retry Verification
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const getNotificationTitle = (verification: VerificationResult): string => {
  const patient = `${verification.patient.firstName} ${verification.patient.lastName}`;
  
  switch (verification.status) {
    case 'ineligible':
      return `Ineligible Coverage - ${patient}`;
    case 'requires_auth':
      return `Prior Auth Required - ${patient}`;
    case 'error':
      return `Verification Failed - ${patient}`;
    default:
      return `Review Required - ${patient}`;
  }
};

const getNotificationMessage = (verification: VerificationResult): string => {
  switch (verification.status) {
    case 'ineligible':
      return `Insurance coverage is not active or valid. Contact patient about payment options.`;
    case 'requires_auth':
      return `Prior authorization needed before appointment. Contact ${verification.patient.insuranceCompany}.`;
    case 'error':
      return `Verification process failed. Manual review and retry required.`;
    default:
      return `Manual review needed for this verification.`;
  }
};

const getNotificationUrgency = (status: VerificationResult['status']): 'low' | 'medium' | 'high' => {
  switch (status) {
    case 'error':
    case 'ineligible':
      return 'high';
    case 'requires_auth':
      return 'medium';
    default:
      return 'low';
  }
};

export default DashboardNotifications;
