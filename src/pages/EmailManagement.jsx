
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import GmailIntegration from '../components/GmailIntegration';
import EmailDraftGenerator from '../components/EmailDraftGenerator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MessageSquare, Mail } from "lucide-react";

export default function EmailManagement() {
  const { toast } = useToast();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'properties'));
        const propertiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProperties(propertiesData);
        
        if (propertiesData.length > 0) {
          setSelectedPropertyId(propertiesData[0].id);
          setSelectedProperty(propertiesData[0]);
          fetchMessages(propertiesData[0].id);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast({
          title: "Error",
          description: "Failed to load properties",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [toast]);
  
  useEffect(() => {
    // Filter messages based on search query
    if (searchQuery.trim() === '') {
      setFilteredMessages(messages);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMessages(
        messages.filter(msg => 
          msg.content.toLowerCase().includes(query) ||
          msg.sender.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, messages]);
  
  const fetchMessages = async (propertyId) => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch messages from Firestore
      // For demo purposes, we'll simulate messages if the property doesn't have any
      const propertyDoc = properties.find(p => p.id === propertyId);
      
      if (!propertyDoc) {
        console.error("Property not found");
        return;
      }
      
      setSelectedProperty(propertyDoc);
      
      let propertyMessages = propertyDoc.messages || [];
      
      // If no messages, add some mock data
      if (propertyMessages.length === 0) {
        propertyMessages = [
          {
            sender: 'John Doe',
            receiver: 'Host',
            content: 'Hi there! I was wondering what time check-in is?',
            timestamp: new Date().toISOString(),
            source: 'sample_data'
          },
          {
            sender: 'Jane Smith',
            receiver: 'Host',
            content: 'Is parking available at the property?',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            source: 'sample_data'
          }
        ];
      }
      
      setMessages(propertyMessages);
      setFilteredMessages(propertyMessages);
      setSelectedMessage(null);
      
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePropertyChange = (value) => {
    setSelectedPropertyId(value);
    setSelectedMessage(null);
    fetchMessages(value);
  };
  
  const handleMessageSelect = (message) => {
    setSelectedMessage(message);
  };
  
  const handleMessagesImported = (newMessages) => {
    setMessages(prev => [...newMessages, ...prev]);
    setFilteredMessages(prev => [...newMessages, ...prev]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-primary mb-6">Email Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-lg font-semibold mb-4">Gmail Integration</h2>
            <Select 
              value={selectedPropertyId} 
              onValueChange={handlePropertyChange}
            >
              <SelectTrigger className="mb-4">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.property_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedPropertyId && (
              <GmailIntegration 
                propertyId={selectedPropertyId}
                onMessagesImported={handleMessagesImported}
              />
            )}
          </div>
        </div>
        
        <div className="col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Guest Messages</h2>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search messages"
                    className="pl-8 pr-4 py-1 h-8 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No messages found</p>
                  </div>
                ) : (
                  filteredMessages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`border rounded p-3 hover:bg-gray-50 cursor-pointer transition-colors ${selectedMessage === message ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleMessageSelect(message)}
                    >
                      <div className="flex justify-between">
                        <p className="font-medium text-sm">{message.sender}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp?.seconds * 1000 || Date.parse(message.timestamp) || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 text-gray-700 mt-1">
                        {message.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">AI Response Generator</h2>
              
              {selectedMessage ? (
                <EmailDraftGenerator 
                  property={selectedProperty}
                  message={selectedMessage}
                />
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Select a message to generate a response</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
