declare module 'areacodes' {
  interface AreaCodeLocation {
    code: string;
    city?: string;
    state: string;
    country: string;
  }
  
  function get(areaCode: string): AreaCodeLocation | undefined;
  
  export default { get };
}
