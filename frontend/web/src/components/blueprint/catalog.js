import {
  Bell,
  Boxes,
  Box,
  Braces,
  Cloud,
  Database,
  Folder,
  Globe,
  HardDrive,
  Layers,
  ListOrdered,
  Monitor,
  Radio,
  Search,
  Server,
  Shield,
  Workflow,
  Zap,
} from "lucide-react";

export const HLD_COMPONENTS = [
  { type: "client", label: "Client", icon: Monitor, color: "border-slate-200" },
  { type: "dns", label: "DNS", icon: Globe, color: "border-sky-200" },
  { type: "cdn", label: "CDN", icon: Cloud, color: "border-orange-200" },
  { type: "loadBalancer", label: "Load Balancer", icon: Workflow, color: "border-purple-200" },
  { type: "apiGateway", label: "API Gateway", icon: Layers, color: "border-cyan-200" },
  { type: "nginx", label: "Nginx", icon: Server, color: "border-emerald-400" },
  { type: "server", label: "Server", icon: Server, color: "border-green-200" },
  { type: "microservice", label: "Microservice", icon: Boxes, color: "border-emerald-200" },
  { type: "k8s", label: "K8s", icon: Boxes, color: "border-blue-500" },
  { type: "worker", label: "Worker", icon: Box, color: "border-lime-200" },
  { type: "database", label: "Database", icon: Database, color: "border-blue-200" },
  { type: "postgres", label: "PostgreSQL", icon: Database, color: "border-blue-300" },
  { type: "mongo", label: "MongoDB", icon: Database, color: "border-green-300" },
  { type: "cache", label: "Cache", icon: Zap, color: "border-yellow-200" },
  { type: "redis", label: "Redis", icon: Zap, color: "border-red-200" },
  { type: "queue", label: "Queue", icon: ListOrdered, color: "border-pink-200" },
  { type: "rabbitmq", label: "RabbitMQ", icon: ListOrdered, color: "border-pink-300" },
  { type: "kafka", label: "Kafka", icon: Radio, color: "border-fuchsia-200" },
  { type: "pubsub", label: "Pub/Sub", icon: Radio, color: "border-fuchsia-200" },
  { type: "storage", label: "Storage", icon: HardDrive, color: "border-indigo-200" },
  { type: "s3", label: "S3", icon: HardDrive, color: "border-yellow-200" },
  { type: "blobStorage", label: "Blob Storage", icon: Folder, color: "border-violet-200" },
  { type: "search", label: "Search", icon: Search, color: "border-teal-200" },
  { type: "notification", label: "Notification", icon: Bell, color: "border-rose-200" },
  { type: "firewall", label: "Firewall", icon: Shield, color: "border-red-200" },
];

export const LLD_COMPONENTS = [
  { type: "class", label: "Class", icon: Braces, color: "border-amber-300" },
  { type: "interface", label: "Interface", icon: Layers, color: "border-sky-300" },
  { type: "abstract", label: "Abstract", icon: Box, color: "border-purple-300" },
  { type: "enum", label: "Enum", icon: ListOrdered, color: "border-emerald-300" },
  { type: "controller", label: "Controller", icon: Monitor, color: "border-cyan-300" },
  { type: "service", label: "Service", icon: Workflow, color: "border-blue-300" },
  { type: "repository", label: "Repository", icon: Database, color: "border-indigo-300" },
];

export function catalogFor(lld) {
  return lld ? LLD_COMPONENTS : HLD_COMPONENTS;
}

export function componentByType(type, lld) {
  return (
    catalogFor(lld).find((item) => item.type === type) || {
      type: "custom",
      label: "Custom",
      icon: Box,
      color: "border-slate-400",
    }
  );
}
