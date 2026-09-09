import { CloudProvider, CloudDriver, CloudContainer } from './types';
import { RailwayDriver } from './railway';
import { FlyDriver } from './fly';
import { RenderDriver } from './render';

export * from './types';
export { RailwayDriver } from './railway';
export { FlyDriver } from './fly';
export { RenderDriver } from './render';

export const railwayDriver = new RailwayDriver();
export const flyDriver = new FlyDriver();
export const renderDriver = new RenderDriver();

export const DRIVERS: Record<CloudProvider, CloudDriver> = {
  railway: railwayDriver,
  fly: flyDriver,
  render: renderDriver,
};

export function getDriver(provider: CloudProvider): CloudDriver {
  const driver = DRIVERS[provider];
  if (!driver) {
    throw new Error(`Unsupported cloud provider: ${provider}. Supported: railway, fly, render`);
  }
  return driver;
}

export async function getAllContainers(): Promise<{ containers: CloudContainer[]; isDemo: boolean }> {
  const results = await Promise.allSettled([
    railwayDriver.listContainers(),
    flyDriver.listContainers(),
    renderDriver.listContainers(),
  ]);

  const allContainers: CloudContainer[] = [];
  let isDemo = false;

  results.forEach(res => {
    if (res.status === 'fulfilled') {
      allContainers.push(...res.value.containers);
      if (res.value.isDemo) isDemo = true;
    }
  });

  return { containers: allContainers, isDemo };
}
