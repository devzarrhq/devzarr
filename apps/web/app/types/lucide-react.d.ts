declare module "lucide-react" {
  import * as React from "react";
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    color?: string;
    size?: string | number;
    absoluteStrokeWidth?: boolean;
    children?: React.ReactNode;
  }
  export const Sun: React.FC<LucideProps>;
  export const Moon: React.FC<LucideProps>;
  export const Palette: React.FC<LucideProps>;
  export const Home: React.FC<LucideProps>;
  export const Rocket: React.FC<LucideProps>;
  export const Users: React.FC<LucideProps>;
  export const MessageCircle: React.FC<LucideProps>;
  export const Settings: React.FC<LucideProps>;
  export const UserCircle: React.FC<LucideProps>;
  export const Menu: React.FC<LucideProps>;
  export const Pencil: React.FC<LucideProps>;
  // Add more icons as needed
}