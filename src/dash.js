// Integral of a fast-start, ease-out velocity curve, normalized to one full dash.
export const dashProgress=t=>1-(1-Math.max(0,Math.min(1,t)))**3;
