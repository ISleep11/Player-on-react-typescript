export interface IOptions {
  margin?: { top: number; bottom: number; left: number; right: number };
  height?: number;
  width?: number;
  padding?: number;
}

export interface IButtonProps {
  onClick: funnction;
  text: string;
}
