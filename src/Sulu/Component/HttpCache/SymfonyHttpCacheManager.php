<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Component\HttpCache;

use FOS\HttpCache\CacheInvalidator;
use FOS\HttpCache\Exception\ExceptionCollection;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Sulu\Component\Content\StructureInterface;
use Sulu\Component\Webspace\Manager\WebspaceManagerInterface;

/**
 * Sulu cache manager
 */
class SymfonyHttpCacheManager implements HttpCacheManagerInterface
{

    /**
     * @var WebspaceManagerInterface
     */
    protected $webspaceManager;

    /**
     * @var LoggerInterface
     */
    protected $logger;

    /**
     * @var CacheInvalidator
     */
    protected $cacheInvalidator;

    /**
     * @param WebspaceManagerInterface $webspaceManager
     * @param null $logger
     */
    public function __construct(WebspaceManagerInterface $webspaceManager, $logger = null)
    {
        $this->webspaceManager = $webspaceManager;
        $this->logger = $logger ? : new NullLogger();
    }

    /**
     * {@inheritdoc}
     */
    public function expire(StructureInterface $structure, $environment = 'prod')
    {
        if ($structure->hasTag('sulu.rlp') && $structure->getPropertyValueByTagName('sulu.rlp') !== null) {
            $urls = $this->webspaceManager->findUrlsByResourceLocator(
                $structure->getPropertyValueByTagName('sulu.rlp'),
                $environment,
                $structure->getLanguageCode(),
                $structure->getWebspaceKey()
            );

            if (count($urls) > 0) {

                foreach ($urls as $url) {
                    $this->invalidatePath($url);
                }

                $this->flush();
            }
        }
    }

    private function invalidatePath($url)
    {
        $this->logger->info('Invalidate path: ' . $url);
        $this->getCacheInvalidator()->invalidatePath($url);
    }

    private function flush()
    {
        try {
            $this->getCacheInvalidator()->flush();
        } catch (ExceptionCollection $exceptions) {
            // Log exception, but prevent bubbling up.
            // It would only confuse the end user.
            foreach ($exceptions as $exception) {
                /** @var \Exception $exception */
                $this->logger->info($exception->getMessage());
            }
        }
    }

    /**
     * @return CacheInvalidator
     */
    private function getCacheInvalidator()
    {

        if (null === $this->cacheInvalidator) {
            $client = new ProxyClient\Symfony();
            $this->cacheInvalidator = new CacheInvalidator($client);
        }

        return $this->cacheInvalidator;
    }
}
